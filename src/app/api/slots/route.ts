import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/auth";
import { slotSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const session = await requireBusiness();
    const businessId = session.user.businessId!;
    const { searchParams } = new URL(req.url);
    const isDashboard = searchParams.get("dashboard") === "true";

    if (isDashboard) {
      const now = new Date();
      const sevenDaysLater = new Date(
        now.getTime() + 7 * 24 * 60 * 60 * 1000
      );

      const slots = await prisma.slot.findMany({
        where: {
          businessId,
          startTime: {
            gte: now,
            lte: sevenDaysLater,
          },
          status: "OPEN",
        },
        include: {
          offers: {
            include: {
              rule: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { startTime: "asc" },
      });

      return NextResponse.json(slots);
    }

    const slots = await prisma.slot.findMany({
      where: { businessId },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json(slots);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status =
      message === "Unauthorized" || message === "No business" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireBusiness();
    const businessId = session.user.businessId!;
    const body = await req.json();

    const parsed = slotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const slot = await prisma.slot.create({
      data: {
        businessId,
        serviceType: parsed.data.serviceType,
        startTime: new Date(parsed.data.startTime),
        endTime: new Date(parsed.data.endTime),
        capacity: parsed.data.capacity,
        bookedCount: parsed.data.bookedCount,
        basePriceCents: parsed.data.basePriceCents,
      },
    });

    return NextResponse.json(slot, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status =
      message === "Unauthorized" || message === "No business" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
