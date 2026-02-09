import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/auth";

const DEFAULT_WEEKLY_HOURS = JSON.stringify({
  "0": [],
  "1": [{ start: "09:00", end: "17:00" }],
  "2": [{ start: "09:00", end: "17:00" }],
  "3": [{ start: "09:00", end: "17:00" }],
  "4": [{ start: "09:00", end: "17:00" }],
  "5": [{ start: "09:00", end: "17:00" }],
  "6": [],
});

export async function GET() {
  try {
    const session = await requireBusiness();
    const businessId = session.user.businessId!;

    const templates = await prisma.slotTemplate.findMany({
      where: { businessId },
      include: {
        _count: { select: { slots: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(templates);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    const status = msg === "Unauthorized" || msg === "No business" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireBusiness();
    const businessId = session.user.businessId!;
    const body = await req.json();

    const name = (body.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const template = await prisma.slotTemplate.create({
      data: {
        businessId,
        name,
        durationMinutes: body.durationMinutes || 30,
        capacity: body.capacity || 1,
        basePriceCents: body.basePriceCents || 0,
        color: body.color || "#4f46e5",
        weeklyHours: body.weeklyHours || DEFAULT_WEEKLY_HOURS,
        daysInAdvance: body.daysInAdvance || 60,
        minNoticeHours: body.minNoticeHours || 4,
        bufferMinutes: body.bufferMinutes || 0,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    const status = msg === "Unauthorized" || msg === "No business" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
