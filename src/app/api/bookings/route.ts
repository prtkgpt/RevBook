import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireBusiness();
    const bookings = await prisma.booking.findMany({
      where: { businessId: session.user.businessId! },
      include: {
        slot: {
          select: {
            serviceType: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(bookings);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "No business") {
      return NextResponse.json({ error: "No business" }, { status: 403 });
    }
    console.error("List bookings error:", error);
    return NextResponse.json({ error: "Failed to list bookings" }, { status: 500 });
  }
}
