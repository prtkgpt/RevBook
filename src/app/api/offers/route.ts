import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireBusiness();

    const offers = await prisma.offer.findMany({
      where: { businessId: session.user.businessId! },
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(offers);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "No business") {
      return NextResponse.json({ error: "No business" }, { status: 403 });
    }
    console.error("List offers error:", error);
    return NextResponse.json(
      { error: "Failed to list offers" },
      { status: 500 }
    );
  }
}
