import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export async function POST() {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to your environment." },
        { status: 503 }
      );
    }

    const session = await requireOwner();
    const businessId = session.user.businessId!;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    let accountId = business.stripeAccountId;

    // Create a Stripe Connect account if none exists
    if (!accountId) {
      const account = await getStripe().accounts.create({
        type: "standard",
        email: session.user.email || undefined,
        business_profile: {
          name: business.name,
        },
        metadata: {
          businessId: business.id,
        },
      });
      accountId = account.id;

      await prisma.business.update({
        where: { id: businessId },
        data: { stripeAccountId: accountId },
      });
    }

    // Create an account link for onboarding
    const origin = process.env.NEXTAUTH_URL || "https://revbookapp.com";
    const accountLink = await getStripe().accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/app/settings?stripe=refresh`,
      return_url: `${origin}/app/settings?stripe=success`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    const status = msg === "Unauthorized" || msg === "No business" ? 401 : msg === "Forbidden" ? 403 : 500;
    console.error("Stripe connect error:", error);
    return NextResponse.json({ error: msg }, { status });
  }
}

// Check Stripe account status
export async function GET() {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ configured: false, onboarded: false });
    }

    const session = await requireOwner();
    const business = await prisma.business.findUnique({
      where: { id: session.user.businessId! },
    });

    if (!business?.stripeAccountId) {
      return NextResponse.json({ configured: false, onboarded: false });
    }

    const account = await getStripe().accounts.retrieve(business.stripeAccountId);
    const onboarded = account.charges_enabled && account.payouts_enabled;

    // Update our DB if status changed
    if (onboarded !== business.stripeOnboarded) {
      await prisma.business.update({
        where: { id: business.id },
        data: { stripeOnboarded: onboarded },
      });
    }

    return NextResponse.json({
      configured: true,
      onboarded,
      accountId: business.stripeAccountId,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    const status = msg === "Unauthorized" || msg === "No business" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
