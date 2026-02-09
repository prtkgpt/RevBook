import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const businesses = await prisma.business.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true, slots: true, bookings: true } },
        users: {
          where: { role: "OWNER" },
          select: { email: true },
          take: 1,
        },
      },
    });

    const result = businesses.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      createdAt: b.createdAt,
      ownerEmail: b.users[0]?.email || null,
      _count: b._count,
    }));

    return NextResponse.json({ businesses: result });
  } catch {
    return NextResponse.json(
      { error: "Failed to load businesses" },
      { status: 500 }
    );
  }
}
