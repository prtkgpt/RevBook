import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireBusiness();
    const businessId = session.user.businessId!;

    // Verify the slot belongs to this business
    const existing = await prisma.slot.findFirst({
      where: { id: params.id, businessId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    const body = await req.json();

    // Only allow updating specific fields
    const updateData: Record<string, unknown> = {};
    if (body.serviceType !== undefined) updateData.serviceType = body.serviceType;
    if (body.startTime !== undefined) updateData.startTime = new Date(body.startTime);
    if (body.endTime !== undefined) updateData.endTime = new Date(body.endTime);
    if (body.capacity !== undefined) updateData.capacity = Number(body.capacity);
    if (body.bookedCount !== undefined) updateData.bookedCount = Number(body.bookedCount);
    if (body.basePriceCents !== undefined)
      updateData.basePriceCents = Number(body.basePriceCents);
    if (body.status !== undefined) updateData.status = body.status;

    const slot = await prisma.slot.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(slot);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status =
      message === "Unauthorized" || message === "No business" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireBusiness();
    const businessId = session.user.businessId!;

    // Verify the slot belongs to this business
    const existing = await prisma.slot.findFirst({
      where: { id: params.id, businessId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    await prisma.slot.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status =
      message === "Unauthorized" || message === "No business" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
