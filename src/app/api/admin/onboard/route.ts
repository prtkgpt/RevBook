import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

// Admin creates a new business + owner user account
export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role === "VIEWER") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    const { businessName, slug, ownerName, ownerEmail, ownerPassword, timezone } = await req.json();

    if (!businessName || !slug || !ownerEmail) {
      return NextResponse.json(
        { error: "Business name, slug, and owner email are required" },
        { status: 400 }
      );
    }

    // Validate slug
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug) || slug.length < 2 || slug.length > 60) {
      return NextResponse.json({ error: "Invalid slug format" }, { status: 400 });
    }

    // Check slug uniqueness
    const existingSlug = await prisma.business.findUnique({ where: { slug } });
    if (existingSlug) {
      return NextResponse.json({ error: "Slug is already taken" }, { status: 409 });
    }

    // Check if user email already exists
    const existingUser = await prisma.user.findUnique({ where: { email: ownerEmail } });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Create business + user in transaction
    const result = await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name: businessName,
          slug,
          timezone: timezone || "America/New_York",
        },
      });

      const passwordHash = ownerPassword ? await hash(ownerPassword, 12) : null;

      const user = await tx.user.create({
        data: {
          email: ownerEmail,
          name: ownerName || null,
          passwordHash,
          role: "OWNER",
          businessId: business.id,
          emailVerified: new Date(),
        },
      });

      return { business, user };
    });

    return NextResponse.json(
      {
        business: { id: result.business.id, name: result.business.name, slug: result.business.slug },
        user: { id: result.user.id, email: result.user.email },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin onboard error:", error);
    return NextResponse.json(
      { error: "Failed to create business account" },
      { status: 500 }
    );
  }
}
