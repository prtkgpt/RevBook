import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/auth";
import { generateSlotsFromTemplate } from "@/lib/slot-generator";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireBusiness();
    const { id } = await params;

    const template = await prisma.slotTemplate.findUnique({ where: { id } });
    if (!template || template.businessId !== session.user.businessId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!template.enabled) {
      return NextResponse.json(
        { error: "Template is disabled" },
        { status: 400 }
      );
    }

    const result = await generateSlotsFromTemplate(id);
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    const status = msg === "Unauthorized" || msg === "No business" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
