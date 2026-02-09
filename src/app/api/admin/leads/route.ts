import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const leads = await prisma.inboundLead.findMany({
      orderBy: { createdAt: "desc" },
    });

    const counts = {
      total: leads.length,
      new: leads.filter((l) => l.status === "NEW").length,
      contacted: leads.filter((l) => l.status === "CONTACTED").length,
      qualified: leads.filter((l) => l.status === "QUALIFIED").length,
      converted: leads.filter((l) => l.status === "CONVERTED").length,
    };

    return NextResponse.json({ leads, counts });
  } catch {
    return NextResponse.json(
      { error: "Failed to load leads" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, status, notes, assignedTo } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
    }

    const validStatuses = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;

    const lead = await prisma.inboundLead.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ lead });
  } catch {
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    );
  }
}
