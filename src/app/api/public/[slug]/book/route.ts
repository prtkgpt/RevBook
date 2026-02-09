import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findBestRule, calculateDiscountedPrice } from "@/lib/rule-engine";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const business = await prisma.business.findUnique({
      where: { slug },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { slotId, customerName, customerEmail, customerPhone } = body;

    if (!slotId || !customerName || !customerEmail) {
      return NextResponse.json(
        { error: "slotId, customerName, and customerEmail are required" },
        { status: 400 }
      );
    }

    const slot = await prisma.slot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      return NextResponse.json(
        { error: "Slot not found" },
        { status: 404 }
      );
    }

    if (slot.businessId !== business.id) {
      return NextResponse.json(
        { error: "Slot does not belong to this business" },
        { status: 400 }
      );
    }

    if (slot.status !== "OPEN") {
      return NextResponse.json(
        { error: "Slot is not available for booking" },
        { status: 409 }
      );
    }

    if (slot.bookedCount >= slot.capacity) {
      return NextResponse.json(
        { error: "Slot is full" },
        { status: 409 }
      );
    }

    // Re-calculate discount at booking time for price integrity
    const now = new Date();
    const rules = await prisma.discountRule.findMany({
      where: {
        businessId: business.id,
        enabled: true,
      },
    });

    const bestRule = findBestRule(rules, slot, now);
    const discountPercent = bestRule ? bestRule.discountPercent : 0;
    const pricePaidCents = bestRule
      ? calculateDiscountedPrice(slot.basePriceCents, discountPercent)
      : slot.basePriceCents;

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
          pricePaidCents,
          originalPriceCents: slot.basePriceCents,
          discountPercent,
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

    return NextResponse.json(
      {
        id: booking.id,
        slotId: booking.slotId,
        customerName: booking.customerName,
        serviceType: slot.serviceType,
        startTime: slot.startTime,
        endTime: slot.endTime,
        pricePaidCents: booking.pricePaidCents,
        originalPriceCents: booking.originalPriceCents,
        discountPercent: booking.discountPercent,
        businessName: business.name,
      },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
