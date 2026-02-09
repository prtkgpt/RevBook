import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { businessSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const data = businessSchema.parse(body);

    if (session.user.businessId) {
      return NextResponse.json({ error: "Already have a business" }, { status: 400 });
    }

    // Check slug uniqueness
    const existingSlug = await prisma.business.findUnique({
      where: { slug: data.slug },
    });
    if (existingSlug) {
      return NextResponse.json({ error: "This URL slug is already taken" }, { status: 409 });
    }

    const business = await prisma.business.create({
      data: {
        name: data.name,
        slug: data.slug,
        timezone: data.timezone,
        bookingBaseUrl: data.bookingBaseUrl || null,
      },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { businessId: business.id, role: "OWNER" },
    });

    return NextResponse.json(business, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Create business error:", error);
    return NextResponse.json({ error: "Failed to create business" }, { status: 500 });
  }
}
