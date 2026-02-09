import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { findBestRule, calculateDiscountedPrice } from "@/lib/rule-engine";

export async function POST(req: NextRequest) {
  try {
    const { slotId, slug, customerName, customerEmail, customerPhone } = await req.json();

    if (!slotId || !slug || !customerName || !customerEmail) {
      return NextResponse.json(
        { error: "slotId, slug, customerName, and customerEmail are required" },
        { status: 400 }
      );
    }

    const business = await prisma.business.findUnique({ where: { slug } });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const slot = await prisma.slot.findUnique({ where: { id: slotId } });
    if (!slot || slot.businessId !== business.id) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    if (slot.status !== "OPEN" || slot.bookedCount >= slot.capacity) {
      return NextResponse.json({ error: "Slot is no longer available" }, { status: 409 });
    }

    // Calculate price
    const now = new Date();
    const rules = await prisma.discountRule.findMany({
      where: { businessId: business.id, enabled: true },
    });
    const bestRule = findBestRule(rules, slot, now);
    const discountPercent = bestRule ? bestRule.discountPercent : 0;
    const priceCents = bestRule
      ? calculateDiscountedPrice(slot.basePriceCents, discountPercent)
      : slot.basePriceCents;

    // If Stripe is configured and business has onboarded, create checkout session
    if (isStripeConfigured() && business.stripeAccountId && business.stripeOnboarded && priceCents > 0) {
      const origin = process.env.NEXTAUTH_URL || "https://revbookapp.com";

      // Create a pending booking first
      const booking = await prisma.booking.create({
        data: {
          businessId: business.id,
          slotId: slot.id,
          customerName,
          customerEmail,
          customerPhone: customerPhone || null,
          pricePaidCents: priceCents,
          originalPriceCents: slot.basePriceCents,
          discountPercent,
          paymentStatus: "PENDING",
        },
      });

      const session = await getStripe().checkout.sessions.create({
        mode: "payment",
        customer_email: customerEmail,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `${slot.serviceType} — ${business.name}`,
                description: `${new Date(slot.startTime).toLocaleDateString()} at ${new Date(slot.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
              },
              unit_amount: priceCents,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          application_fee_amount: Math.round(priceCents * 0.05), // 5% platform fee
          transfer_data: {
            destination: business.stripeAccountId,
          },
        },
        success_url: `${origin}/book/${slug}/success?booking=${booking.id}`,
        cancel_url: `${origin}/book/${slug}?cancelled=true`,
        metadata: {
          bookingId: booking.id,
          businessId: business.id,
          slotId: slot.id,
        },
      });

      await prisma.booking.update({
        where: { id: booking.id },
        data: { stripeSessionId: session.id },
      });

      return NextResponse.json({ url: session.url, mode: "stripe" });
    }

    // No Stripe — do direct booking (free or Stripe not configured)
    const newBookedCount = slot.bookedCount + 1;
    const shouldMarkFull = newBookedCount >= slot.capacity;

    const [booking] = await prisma.$transaction([
      prisma.booking.create({
        data: {
          businessId: business.id,
          slotId: slot.id,
          customerName,
          customerEmail,
          customerPhone: customerPhone || null,
          pricePaidCents: priceCents,
          originalPriceCents: slot.basePriceCents,
          discountPercent,
          paymentStatus: priceCents === 0 ? "FREE" : "PAID",
        },
      }),
      prisma.slot.update({
        where: { id: slot.id },
        data: {
          bookedCount: newBookedCount,
          ...(shouldMarkFull && { status: "FULL" }),
        },
      }),
    ]);

    return NextResponse.json({
      mode: "direct",
      bookingId: booking.id,
      serviceType: slot.serviceType,
      startTime: slot.startTime,
      endTime: slot.endTime,
      pricePaidCents: booking.pricePaidCents,
      originalPriceCents: booking.originalPriceCents,
      discountPercent: booking.discountPercent,
      businessName: business.name,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
