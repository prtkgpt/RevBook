import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireBusiness();
    const business = await prisma.business.findUnique({
      where: { id: session.user.businessId! },
      select: { slug: true },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }
    return NextResponse.json({ slug: business.slug });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "No business") {
      return NextResponse.json({ error: "No business" }, { status: 403 });
    }
    console.error("Get business slug error:", error);
    return NextResponse.json({ error: "Failed to get slug" }, { status: 500 });
  }
}
