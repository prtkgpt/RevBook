import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, slots: true, bookings: true } },
        users: {
          where: { role: "OWNER" },
          select: { email: true, name: true },
          take: 1,
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(business);
  } catch {
    return NextResponse.json({ error: "Failed to load business" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  try {
    const existing = await prisma.business.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.slug !== undefined) {
      const slug = body.slug.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 60);
      if (!slug) {
        return NextResponse.json({ error: "Slug cannot be empty" }, { status: 400 });
      }
      const taken = await prisma.business.findFirst({ where: { slug, id: { not: id } } });
      if (taken) {
        return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
      }
      data.slug = slug;
    }
    if (body.timezone !== undefined) data.timezone = body.timezone;
    if (body.description !== undefined) data.description = body.description;

    const updated = await prisma.business.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update business" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.business.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.business.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete business" }, { status: 500 });
  }
}
