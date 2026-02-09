import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findBestRule, calculateDiscountedPrice } from "@/lib/rule-engine";
import { sendOfferEmail, sendOfferSms } from "@/lib/messaging";
import { addDays, format, subHours } from "date-fns";

export async function GET(req: NextRequest) {
  // Validate CRON_SECRET
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const sevenDaysFromNow = addDays(now, 7);

  const summary = {
    businessesProcessed: 0,
    offersCreated: 0,
    offersUpdated: 0,
    offersSent: 0,
    offersExpired: 0,
    messagesSent: 0,
    errors: [] as string[],
  };

  try {
    // 1. Find all businesses
    const businesses = await prisma.business.findMany({
      include: {
        discountRules: { where: { enabled: true } },
      },
    });

    for (const business of businesses) {
      summary.businessesProcessed++;

      try {
        // 2. Find upcoming OPEN slots within next 7 days
        const slots = await prisma.slot.findMany({
          where: {
            businessId: business.id,
            status: "OPEN",
            startTime: {
              gte: now,
              lte: sevenDaysFromNow,
            },
          },
        });

        // 3. Evaluate discount rules against each slot
        for (const slot of slots) {
          const bestRule = findBestRule(business.discountRules, slot, now);
          if (!bestRule) continue;

          const discountedPriceCents = calculateDiscountedPrice(
            slot.basePriceCents,
            bestRule.discountPercent
          );

          // 4. Create/update offers (upsert on slotId+ruleId)
          const existingOffer = await prisma.offer.findUnique({
            where: {
              slotId_ruleId: {
                slotId: slot.id,
                ruleId: bestRule.id,
              },
            },
          });

          let offer;
          if (existingOffer) {
            offer = await prisma.offer.update({
              where: { id: existingOffer.id },
              data: {
                discountPercent: bestRule.discountPercent,
                discountedPriceCents,
                expiresAt: slot.startTime,
              },
            });
            summary.offersUpdated++;
          } else {
            offer = await prisma.offer.create({
              data: {
                businessId: business.id,
                slotId: slot.id,
                ruleId: bestRule.id,
                discountPercent: bestRule.discountPercent,
                discountedPriceCents,
                status: "DRAFT",
                disabledByUser: false,
                expiresAt: slot.startTime,
              },
            });
            summary.offersCreated++;
          }

          // 5. For DRAFT offers not disabled by user, send to eligible customers
          if (offer.status !== "DRAFT" || offer.disabledByUser) continue;

          // 6. Targeting: if rule has serviceTypes, match customers with matching tags; else all customers
          const customers = await getEligibleCustomers(
            business.id,
            bestRule.serviceTypes
          );

          // Anti-spam cutoff: 24 hours ago
          const antiSpamCutoff = subHours(now, 24);

          const serviceType = slot.serviceType;
          const basePrice = formatPrice(slot.basePriceCents);
          const discountedPrice = formatPrice(discountedPriceCents);
          const slotDate = format(slot.startTime, "EEEE, MMMM d 'at' h:mm a");

          const subject = `Special offer: ${bestRule.discountPercent}% off ${serviceType}`;
          const body = `Book your ${serviceType} session at ${discountedPrice} (was ${basePrice}) on ${slotDate}. Limited time offer!`;

          // Build booking URL
          const bookingUrl = business.bookingBaseUrl
            ? `${business.bookingBaseUrl}?offer_id=${offer.id}&slot_id=${slot.id}`
            : `#offer_id=${offer.id}&slot_id=${slot.id}`;

          let sentToAny = false;

          for (const customer of customers) {
            // 7. Anti-spam: don't send more than 1 offer per customer per 24 hours per business
            const recentMessage = await prisma.messageLog.findFirst({
              where: {
                customerId: customer.id,
                businessId: business.id,
                sentAt: { gte: antiSpamCutoff },
              },
            });

            if (recentMessage) continue;

            // 8. Send via email and/or SMS
            const sendParams = {
              offerId: offer.id,
              customerId: customer.id,
              businessId: business.id,
              customerEmail: customer.email,
              customerPhone: customer.phone,
              subject,
              body,
              bookingUrl,
            };

            let messageSent = false;

            if (customer.email) {
              const emailSent = await sendOfferEmail(sendParams);
              if (emailSent) {
                messageSent = true;
                summary.messagesSent++;
              }
            }

            if (customer.phone) {
              const smsSent = await sendOfferSms(sendParams);
              if (smsSent) {
                messageSent = true;
                summary.messagesSent++;
              }
            }

            if (messageSent) {
              sentToAny = true;
            }
          }

          // 9. Mark offers as SENT after sending
          if (sentToAny) {
            await prisma.offer.update({
              where: { id: offer.id },
              data: { status: "SENT" },
            });
            summary.offersSent++;
          }
        }

        // 10. Expire offers where slot startTime has passed
        const expired = await prisma.offer.updateMany({
          where: {
            businessId: business.id,
            status: { in: ["DRAFT", "SENT"] },
            slot: {
              startTime: { lt: now },
            },
          },
          data: { status: "EXPIRED" },
        });
        summary.offersExpired += expired.count;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error";
        summary.errors.push(
          `Business ${business.id}: ${message}`
        );
        console.error(`Cron error for business ${business.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      summary,
      processedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Cron job fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Cron job failed",
        summary,
      },
      { status: 500 }
    );
  }
}

/**
 * Get eligible customers for an offer based on service type targeting.
 * If serviceTypes is set on the rule, match customers whose tags overlap.
 * Otherwise, return all customers for the business.
 */
async function getEligibleCustomers(
  businessId: string,
  ruleServiceTypes: string | null
) {
  const allCustomers = await prisma.customer.findMany({
    where: { businessId },
  });

  if (!ruleServiceTypes) {
    return allCustomers;
  }

  const targetTypes = ruleServiceTypes
    .split(",")
    .map((s) => s.trim().toLowerCase());

  return allCustomers.filter((customer) => {
    if (!customer.tags) return false;
    const customerTags = customer.tags
      .split(",")
      .map((t) => t.trim().toLowerCase());
    return targetTypes.some((t) => customerTags.includes(t));
  });
}

/**
 * Format cents as a dollar string.
 */
function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
