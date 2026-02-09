import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusiness, requireOwner } from "@/lib/auth";
import { discountRuleSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await requireBusiness();
    const rules = await prisma.discountRule.findMany({
      where: { businessId: session.user.businessId! },
      orderBy: { priority: "desc" },
    });
    return NextResponse.json(rules);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "No business") {
      return NextResponse.json({ error: "No business" }, { status: 403 });
    }
    console.error("List rules error:", error);
    return NextResponse.json({ error: "Failed to list rules" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireOwner();
    const body = await req.json();
    const data = discountRuleSchema.parse(body);

    const rule = await prisma.discountRule.create({
      data: {
        businessId: session.user.businessId!,
        name: data.name,
        enabled: data.enabled,
        priority: data.priority,
        hoursBeforeSlot: data.hoursBeforeSlot ?? null,
        maxBookedPercent: data.maxBookedPercent ?? null,
        daysOfWeek: data.daysOfWeek ?? null,
        afterTimeOfDay: data.afterTimeOfDay ?? null,
        beforeTimeOfDay: data.beforeTimeOfDay ?? null,
        serviceTypes: data.serviceTypes ?? null,
        discountPercent: data.discountPercent,
      },
    });

    return NextResponse.json(rule, { status: 201 });
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
    console.error("Create rule error:", error);
    return NextResponse.json({ error: "Failed to create rule" }, { status: 500 });
  }
}
