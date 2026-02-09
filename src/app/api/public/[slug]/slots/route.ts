import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findBestRule, calculateDiscountedPrice } from "@/lib/rule-engine";

export async function GET(
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

    const now = new Date();

    const slots = await prisma.slot.findMany({
      where: {
        businessId: business.id,
        status: "OPEN",
        startTime: { gt: now },
      },
      orderBy: { startTime: "asc" },
    });

    const rules = await prisma.discountRule.findMany({
      where: {
        businessId: business.id,
        enabled: true,
      },
    });

    const result = slots
      .filter((slot) => slot.bookedCount < slot.capacity)
      .map((slot) => {
        const bestRule = findBestRule(rules, slot, now);
        const hasDiscount = bestRule !== null;
        const discountPercent = hasDiscount ? bestRule.discountPercent : 0;
        const currentPriceCents = hasDiscount
          ? calculateDiscountedPrice(slot.basePriceCents, discountPercent)
          : slot.basePriceCents;

        return {
          id: slot.id,
          serviceType: slot.serviceType,
          startTime: slot.startTime,
          endTime: slot.endTime,
          capacity: slot.capacity,
          bookedCount: slot.bookedCount,
          spotsLeft: slot.capacity - slot.bookedCount,
          basePriceCents: slot.basePriceCents,
          currentPriceCents,
          discountPercent,
          hasDiscount,
        };
      });

    return NextResponse.json({
      business: { name: business.name, slug: business.slug },
      slots: result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
