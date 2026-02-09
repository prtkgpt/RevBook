import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [totalBusinesses, totalUsers, totalBookings, revenueAgg, recentBusinesses, recentBookings] =
      await Promise.all([
        prisma.business.count(),
        prisma.user.count(),
        prisma.booking.count(),
        prisma.booking.aggregate({ _sum: { pricePaidCents: true } }),
        prisma.business.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            _count: { select: { users: true, slots: true, bookings: true } },
          },
        }),
        prisma.booking.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            business: { select: { name: true } },
            slot: { select: { serviceType: true, startTime: true } },
          },
        }),
      ]);

    return NextResponse.json({
      totalBusinesses,
      totalUsers,
      totalBookings,
      totalRevenueCents: revenueAgg._sum.pricePaidCents || 0,
      recentBusinesses,
      recentBookings,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load stats" },
      { status: 500 }
    );
  }
}
