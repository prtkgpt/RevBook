import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireOwner();
    const business = await prisma.business.findUnique({
      where: { id: session.user.businessId! },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, passwordHash: true },
    });

    return NextResponse.json({
      business,
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        hasPassword: !!user?.passwordHash,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    const status = msg === "Unauthorized" || msg === "No business" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireOwner();
    const body = await req.json();
    const businessId = session.user.businessId!;

    // Validate slug if changing
    if (body.slug !== undefined) {
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(body.slug) || body.slug.length < 2 || body.slug.length > 60) {
        return NextResponse.json({ error: "Invalid slug format" }, { status: 400 });
      }
      const existing = await prisma.business.findFirst({
        where: { slug: body.slug, id: { not: businessId } },
      });
      if (existing) {
        return NextResponse.json({ error: "This URL slug is already taken" }, { status: 409 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.timezone !== undefined) updateData.timezone = body.timezone;
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.primaryColor !== undefined) updateData.primaryColor = body.primaryColor;
    if (body.bookingBaseUrl !== undefined) updateData.bookingBaseUrl = body.bookingBaseUrl || null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const business = await prisma.business.update({
      where: { id: businessId },
      data: updateData,
    });

    // Also update user name if provided
    if (body.userName !== undefined) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name: body.userName },
      });
    }

    return NextResponse.json(business);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    const status = msg === "Unauthorized" || msg === "No business" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
