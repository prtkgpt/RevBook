"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface BusinessRow {
  id: string;
  name: string;
  slug: string;
  timezone: string;
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

  // Edit modal state
  const [editing, setEditing] = useState<BusinessRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editTimezone, setEditTimezone] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete state
  const [deleting, setDeleting] = useState<string | null>(null);

  function fetchBusinesses() {
    fetch("/api/admin/businesses")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load businesses");
        return res.json();
      })
      .then((data) => setBusinesses(data.businesses))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchBusinesses();
  }, []);

  function openEdit(biz: BusinessRow) {
    setEditing(biz);
    setEditName(biz.name);
    setEditSlug(biz.slug);
    setEditTimezone(biz.timezone || "America/New_York");
    setEditError("");
  }

  async function handleEditSave() {
    if (!editing) return;
    setEditSaving(true);
    setEditError("");

    try {
      const res = await fetch(`/api/admin/businesses/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, slug: editSlug, timezone: editTimezone }),
      });

      if (!res.ok) {
        const data = await res.json();
        setEditError(data.error || "Failed to update");
        return;
      }

      setEditing(null);
      fetchBusinesses();
    } catch {
      setEditError("Something went wrong");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(biz: BusinessRow) {
    if (!confirm(`Delete "${biz.name}"? This will permanently remove the business and all its data (slots, bookings, customers, rules). This cannot be undone.`)) return;

    setDeleting(biz.id);
    try {
      const res = await fetch(`/api/admin/businesses/${biz.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete");
        return;
      }
      fetchBusinesses();
    } catch {
      alert("Something went wrong");
    } finally {
      setDeleting(null);
    }
  }

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
                <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <TableSkeleton />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
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
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => openEdit(biz)}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(biz)}
                          disabled={deleting === biz.id}
                          className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          {deleting === biz.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setEditing(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setEditing(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-lg font-bold text-gray-900 mb-1">Edit Business</h2>
            <p className="text-sm text-gray-500 mb-5">Update business details for {editing.name}</p>

            {editError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                {editError}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Business Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">URL Slug</label>
                <div className="flex items-center rounded-lg border border-gray-300 bg-white shadow-sm">
                  <span className="pl-3.5 text-sm text-gray-500">/book/</span>
                  <input
                    type="text"
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    className="flex-1 border-0 bg-transparent px-1 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-0"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Timezone</label>
                <select
                  value={editTimezone}
                  onChange={(e) => setEditTimezone(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Phoenix", "Europe/London", "Europe/Paris", "Asia/Tokyo", "Australia/Sydney"].map((tz) => (
                    <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditing(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
              >
                {editSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
