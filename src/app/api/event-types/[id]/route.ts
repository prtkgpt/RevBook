import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireBusiness();
    const { id } = await params;

    const template = await prisma.slotTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            slots: { where: { startTime: { gte: new Date() } } },
          },
        },
      },
    });

    if (!template || template.businessId !== session.user.businessId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    const status = msg === "Unauthorized" || msg === "No business" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireBusiness();
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.slotTemplate.findUnique({ where: { id } });
    if (!existing || existing.businessId !== session.user.businessId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.durationMinutes !== undefined) data.durationMinutes = body.durationMinutes;
    if (body.capacity !== undefined) data.capacity = body.capacity;
    if (body.basePriceCents !== undefined) data.basePriceCents = body.basePriceCents;
    if (body.color !== undefined) data.color = body.color;
    if (body.weeklyHours !== undefined) {
      data.weeklyHours = typeof body.weeklyHours === "string"
        ? body.weeklyHours
        : JSON.stringify(body.weeklyHours);
    }
    if (body.daysInAdvance !== undefined) data.daysInAdvance = body.daysInAdvance;
    if (body.minNoticeHours !== undefined) data.minNoticeHours = body.minNoticeHours;
    if (body.bufferMinutes !== undefined) data.bufferMinutes = body.bufferMinutes;
    if (body.enabled !== undefined) data.enabled = body.enabled;

    const updated = await prisma.slotTemplate.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    const status = msg === "Unauthorized" || msg === "No business" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireBusiness();
    const { id } = await params;

    const existing = await prisma.slotTemplate.findUnique({ where: { id } });
    if (!existing || existing.businessId !== session.user.businessId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.slotTemplate.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    const status = msg === "Unauthorized" || msg === "No business" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
