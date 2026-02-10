import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
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

    const templates = await prisma.slotTemplate.findMany({
      where: {
        businessId: business.id,
        enabled: true,
      },
      orderBy: { name: "asc" },
      include: {
        slots: {
          where: {
            status: "OPEN",
            startTime: { gt: now },
          },
          select: {
            startTime: true,
            bookedCount: true,
            capacity: true,
          },
        },
      },
    });

    const eventTypes = templates.map((t) => {
      const dateSet = new Set(
        t.slots
          .filter((s) => s.bookedCount < s.capacity)
          .map((s) => s.startTime.toISOString().split("T")[0])
      );
      const availableDates = Array.from(dateSet).sort();

      return {
        id: t.id,
        name: t.name,
        durationMinutes: t.durationMinutes,
        basePriceCents: t.basePriceCents,
        color: t.color,
        availableDates,
      };
    });

    return NextResponse.json({
      business: { name: business.name, slug: business.slug },
      eventTypes,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
