import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireBusiness();
    const { id } = params;
    const body = await req.json();

    // Verify the offer belongs to this business
    const existing = await prisma.offer.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    if (existing.businessId !== session.user.businessId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (typeof body.disabledByUser === "boolean") {
      updateData.disabledByUser = body.disabledByUser;
    }

    if (
      typeof body.status === "string" &&
      ["DRAFT", "SENT", "CLAIMED", "EXPIRED"].includes(body.status)
    ) {
      updateData.status = body.status;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updated = await prisma.offer.update({
      where: { id },
      data: updateData,
      include: {
        slot: {
          select: {
            id: true,
            serviceType: true,
            startTime: true,
            endTime: true,
            basePriceCents: true,
          },
        },
        rule: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "No business") {
      return NextResponse.json({ error: "No business" }, { status: 403 });
    }
    console.error("Update offer error:", error);
    return NextResponse.json(
      { error: "Failed to update offer" },
      { status: 500 }
    );
  }
}
