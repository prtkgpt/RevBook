import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const bookingId = req.nextUrl.searchParams.get("id");

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID required" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({ where: { slug } });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        slot: {
          select: { serviceType: true, startTime: true, endTime: true },
        },
      },
    });

    if (!booking || booking.businessId !== business.id) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      pricePaidCents: booking.pricePaidCents,
      originalPriceCents: booking.originalPriceCents,
      discountPercent: booking.discountPercent,
      paymentStatus: booking.paymentStatus,
      slot: booking.slot,
      business: { name: business.name },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load booking" }, { status: 500 });
  }
}
