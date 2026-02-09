"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface Stats {
  totalBusinesses: number;
  totalUsers: number;
  totalBookings: number;
  totalRevenueCents: number;
  recentBusinesses: {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
    _count: { users: number; slots: number; bookings: number };
  }[];
  recentBookings: {
    id: string;
    customerName: string;
    customerEmail: string;
    pricePaidCents: number;
    discountPercent: number;
    createdAt: string;
    business: { name: string };
    slot: { serviceType: string; startTime: string };
  }[];
}

function KpiSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="skeleton mb-3 h-4 w-24" />
      <div className="skeleton h-8 w-32" />
    </div>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="skeleton h-5 w-40" />
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 px-6 py-4">
            <div className="skeleton h-4 w-1/4" />
            <div className="skeleton h-4 w-1/4" />
            <div className="skeleton h-4 w-1/6" />
            <div className="skeleton h-4 w-1/6" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load stats");
        return res.json();
      })
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
        {error}
      </div>
    );
  }

  const kpis = stats
    ? [
        {
          label: "Total Businesses",
          value: stats.totalBusinesses.toLocaleString(),
          color: "text-indigo-600",
          bg: "bg-indigo-50",
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5M3.75 3v18m16.5-18v18M5.25 3h13.5M5.25 21V6.75A2.25 2.25 0 017.5 4.5h9a2.25 2.25 0 012.25 2.25V21" />
            </svg>
          ),
        },
        {
          label: "Total Users",
          value: stats.totalUsers.toLocaleString(),
          color: "text-emerald-600",
          bg: "bg-emerald-50",
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          ),
        },
        {
          label: "Total Bookings",
          value: stats.totalBookings.toLocaleString(),
          color: "text-amber-600",
          bg: "bg-amber-50",
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          ),
        },
        {
          label: "Total Revenue",
          value: `$${(stats.totalRevenueCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          color: "text-rose-600",
          bg: "bg-rose-50",
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
      ]
    : [];

  return (
    <div className="page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Platform Overview
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor all businesses and activity across the platform.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
          : kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500">
                    {kpi.label}
                  </p>
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${kpi.bg} ${kpi.color}`}
                  >
                    {kpi.icon}
                  </div>
                </div>
                <p className={`mt-2 text-3xl font-bold ${kpi.color}`}>
                  {kpi.value}
                </p>
              </div>
            ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Businesses */}
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-gray-900">
                Recent Businesses
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Business
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Bookings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats?.recentBusinesses.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-gray-400"
                      >
                        No businesses yet.
                      </td>
                    </tr>
                  )}
                  {stats?.recentBusinesses.map((biz) => (
                    <tr
                      key={biz.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-6 py-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {biz.name}
                          </p>
                          <p className="text-xs text-gray-400">/{biz.slug}</p>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {biz._count.users}
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {biz._count.bookings}
                      </td>
                      <td className="px-6 py-3 text-gray-500 text-xs">
                        {new Date(biz.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Bookings */}
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-gray-900">
                Recent Bookings
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Business
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Paid
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats?.recentBookings.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-gray-400"
                      >
                        No bookings yet.
                      </td>
                    </tr>
                  )}
                  {stats?.recentBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-6 py-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {booking.customerName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {booking.customerEmail}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {booking.business.name}
                      </td>
                      <td className="px-6 py-3">
                        <span className="font-medium text-gray-900">
                          ${(booking.pricePaidCents / 100).toFixed(2)}
                        </span>
                        {booking.discountPercent > 0 && (
                          <Badge variant="success" className="ml-2">
                            -{booking.discountPercent}%
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-3 text-gray-500 text-xs">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
