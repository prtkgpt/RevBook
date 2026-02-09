import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid signature";
    console.error("Webhook signature verification failed:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const bookingId = session.metadata?.bookingId;
      const slotId = session.metadata?.slotId;

      if (bookingId) {
        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            paymentStatus: "PAID",
            stripePaymentId: session.payment_intent as string,
          },
        });

        // Increment bookedCount on the slot
        if (slotId) {
          const slot = await prisma.slot.findUnique({ where: { id: slotId } });
          if (slot) {
            const newCount = slot.bookedCount + 1;
            await prisma.slot.update({
              where: { id: slotId },
              data: {
                bookedCount: newCount,
                ...(newCount >= slot.capacity && { status: "FULL" }),
              },
            });
          }
        }
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object;
      const bookingId = session.metadata?.bookingId;
      if (bookingId) {
        await prisma.booking.update({
          where: { id: bookingId },
          data: { paymentStatus: "FAILED" },
        });
      }
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object;
      const paymentId = charge.payment_intent as string;
      if (paymentId) {
        await prisma.booking.updateMany({
          where: { stripePaymentId: paymentId },
          data: { paymentStatus: "REFUNDED" },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
