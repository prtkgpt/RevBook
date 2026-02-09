import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";
import { discountRuleSchema } from "@/lib/validations";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireOwner();
    const body = await req.json();
    const data = discountRuleSchema.partial().parse(body);

    const existing = await prisma.discountRule.findFirst({
      where: { id: params.id, businessId: session.user.businessId! },
    });

    if (!existing) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    const rule = await prisma.discountRule.update({
      where: { id: params.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.hoursBeforeSlot !== undefined && {
          hoursBeforeSlot: data.hoursBeforeSlot ?? null,
        }),
        ...(data.maxBookedPercent !== undefined && {
          maxBookedPercent: data.maxBookedPercent ?? null,
        }),
        ...(data.daysOfWeek !== undefined && {
          daysOfWeek: data.daysOfWeek ?? null,
        }),
        ...(data.afterTimeOfDay !== undefined && {
          afterTimeOfDay: data.afterTimeOfDay ?? null,
        }),
        ...(data.beforeTimeOfDay !== undefined && {
          beforeTimeOfDay: data.beforeTimeOfDay ?? null,
        }),
        ...(data.serviceTypes !== undefined && {
          serviceTypes: data.serviceTypes ?? null,
        }),
        ...(data.discountPercent !== undefined && {
          discountPercent: data.discountPercent,
        }),
      },
    });

    return NextResponse.json(rule);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "No business") {
      return NextResponse.json({ error: "No business" }, { status: 403 });
    }
    console.error("Update rule error:", error);
    return NextResponse.json({ error: "Failed to update rule" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireOwner();

    const existing = await prisma.discountRule.findFirst({
      where: { id: params.id, businessId: session.user.businessId! },
    });

    if (!existing) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    await prisma.discountRule.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "No business") {
      return NextResponse.json({ error: "No business" }, { status: 403 });
    }
    console.error("Delete rule error:", error);
    return NextResponse.json({ error: "Failed to delete rule" }, { status: 500 });
  }
}
