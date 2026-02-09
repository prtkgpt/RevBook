"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface BusinessRow {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  ownerEmail: string | null;
  _count: {
    users: number;
    slots: number;
    bookings: number;
  };
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-6 px-6 py-4">
          <div className="skeleton h-4 w-1/5" />
          <div className="skeleton h-4 w-1/5" />
          <div className="skeleton h-4 w-1/6" />
          <div className="skeleton h-4 w-1/12" />
          <div className="skeleton h-4 w-1/12" />
          <div className="skeleton h-4 w-1/12" />
          <div className="skeleton h-4 w-1/6" />
        </div>
      ))}
    </div>
  );
}

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/businesses")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load businesses");
        return res.json();
      })
      .then((data) => setBusinesses(data.businesses))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = businesses.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.slug.toLowerCase().includes(search.toLowerCase()) ||
      (b.ownerEmail && b.ownerEmail.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page-enter">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Businesses
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            All registered businesses on the platform.
          </p>
        </div>
        <Badge variant="info">
          {businesses.length} total
        </Badge>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, slug, or owner email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full max-w-md rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Business
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Owner
                </th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Users
                </th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Slots
                </th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Bookings
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <TableSkeleton />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    {search
                      ? "No businesses match your search."
                      : "No businesses yet."}
                  </td>
                </tr>
              ) : (
                filtered.map((biz) => (
                  <tr
                    key={biz.id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{biz.name}</p>
                        <p className="text-xs text-gray-400">/{biz.slug}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {biz.ownerEmail || (
                        <span className="text-gray-400">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600">
                      {biz._count.users}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600">
                      {biz._count.slots}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600">
                      {biz._count.bookings}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(biz.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
