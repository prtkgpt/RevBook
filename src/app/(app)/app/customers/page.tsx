"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  tags: string | null;
  lastBookedAt: string | null;
}

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  tags: "",
};

const AVATAR_COLORS: Record<string, string> = {
  A: "bg-rose-500",
  B: "bg-orange-500",
  C: "bg-amber-500",
  D: "bg-yellow-500",
  E: "bg-lime-500",
  F: "bg-green-500",
  G: "bg-emerald-500",
  H: "bg-teal-500",
  I: "bg-cyan-500",
  J: "bg-sky-500",
  K: "bg-blue-500",
  L: "bg-indigo-500",
  M: "bg-violet-500",
  N: "bg-purple-500",
  O: "bg-fuchsia-500",
  P: "bg-pink-500",
  Q: "bg-rose-600",
  R: "bg-orange-600",
  S: "bg-amber-600",
  T: "bg-emerald-600",
  U: "bg-teal-600",
  V: "bg-cyan-600",
  W: "bg-blue-600",
  X: "bg-indigo-600",
  Y: "bg-violet-600",
  Z: "bg-purple-600",
};

function getAvatarColor(name: string): string {
  const letter = name.charAt(0).toUpperCase();
  return AVATAR_COLORS[letter] || "bg-indigo-500";
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCustomers(data);
    } catch {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function populateForm(customer: Customer) {
    setEditingId(customer.id);
    setForm({
      name: customer.name,
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      tags: customer.tags ?? "",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: form.name,
      email: form.email || "",
      phone: form.phone || "",
      tags: form.tags || "",
    };

    try {
      const url = editingId ? `/api/customers/${editingId}` : "/api/customers";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save customer");
        return;
      }

      toast.success(editingId ? "Customer updated" : "Customer created");
      resetForm();
      fetchCustomers();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this customer?")) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Customer deleted");
      if (editingId === id) resetForm();
      fetchCustomers();
    } catch {
      toast.error("Failed to delete customer");
    }
  }

  async function handleImport() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Please select a CSV file");
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import/customers", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Import failed");
        return;
      }

      const result = await res.json();
      toast.success(
        `Imported ${result.imported} customer(s), skipped ${result.skipped}`
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSelectedFileName(null);
      fetchCustomers();
    } catch {
      toast.error("Import failed");
    } finally {
      setImporting(false);
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "--";
    return new Date(dateStr).toLocaleDateString();
  }

  return (
    <div className="space-y-8">
      {/* ── Page header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Customers
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your customer database and import records from CSV.
          </p>
        </div>

        {/* CSV import control */}
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setSelectedFileName(file ? file.name : null);
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50"
          >
            {/* Upload icon */}
            <svg
              className="h-4 w-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
              />
            </svg>
            {selectedFileName ? (
              <span className="max-w-[160px] truncate">{selectedFileName}</span>
            ) : (
              "Choose CSV"
            )}
          </button>

          <Button loading={importing} onClick={handleImport} size="md">
            {/* Upload cloud icon */}
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
              />
            </svg>
            Import
          </Button>
        </div>
      </div>

      {/* ── Add / Edit customer form ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
              {/* User-plus icon */}
              <svg
                className="h-5 w-5 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {editingId ? "Edit customer" : "Add customer"}
              </h2>
              <p className="text-sm text-gray-500">
                {editingId
                  ? "Update the customer details below."
                  : "Fill in the details to create a new customer record."}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Name"
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Jane Doe"
                required
              />
              <Input
                label="Email"
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jane@example.com"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Phone"
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 555-0123"
              />
              <Input
                label="Tags"
                id="tags"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="vip, returning"
                hint="Comma-separated service types"
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
              {editingId && (
                <Button type="button" variant="ghost" onClick={resetForm}>
                  Cancel
                </Button>
              )}
              <Button type="submit" loading={saving}>
                {editingId ? "Save changes" : "Add customer"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* ── Customer list ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg
            className="h-6 w-6 animate-spin text-indigo-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="ml-3 text-sm font-medium text-gray-500">
            Loading customers...
          </span>
        </div>
      ) : customers.length === 0 ? (
        <div className="table-container">
          <div className="flex flex-col items-center justify-center py-20">
            {/* People icon */}
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <svg
                className="h-7 w-7 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                />
              </svg>
            </div>
            <p className="mt-4 text-sm font-medium text-gray-900">
              No customers yet
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Add your first customer above or import from a CSV file.
            </p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Tags</th>
                <th>Last Booked</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => {
                const initial = customer.name.charAt(0).toUpperCase();
                const avatarBg = getAvatarColor(customer.name);

                return (
                  <tr key={customer.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarBg}`}
                        >
                          {initial}
                        </span>
                        <span className="font-medium text-gray-900">
                          {customer.name}
                        </span>
                      </div>
                    </td>
                    <td className="text-gray-600">
                      {customer.email || (
                        <span className="text-gray-300">--</span>
                      )}
                    </td>
                    <td className="text-gray-600">
                      {customer.phone || (
                        <span className="text-gray-300">--</span>
                      )}
                    </td>
                    <td>
                      {customer.tags ? (
                        <div className="flex flex-wrap gap-1.5">
                          {customer.tags.split(",").map((tag, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-300">--</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-gray-600">
                      {formatDate(customer.lastBookedAt)}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => populateForm(customer)}
                          className="gap-1.5"
                        >
                          {/* Pencil icon */}
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                            />
                          </svg>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(customer.id)}
                          className="gap-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        >
                          {/* Trash icon */}
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                            />
                          </svg>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
