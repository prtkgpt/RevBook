"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Customers</h1>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {editingId ? "Edit Customer" : "Add Customer"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
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

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Phone"
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 555-0123"
            />
            <Input
              label="Tags (comma-separated)"
              id="tags"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="vip, returning"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" loading={saving}>
              {editingId ? "Update Customer" : "Add Customer"}
            </Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          CSV Import
        </h2>
        <p className="mb-3 text-sm text-gray-600">
          Upload a CSV file with columns: name (required), email, phone, tags
        </p>
        <div className="flex items-end gap-3">
          <div className="space-y-1">
            <label
              htmlFor="csvFile"
              className="block text-sm font-medium text-gray-700"
            >
              CSV file
            </label>
            <input
              ref={fileInputRef}
              id="csvFile"
              type="file"
              accept=".csv"
              className="block text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            loading={importing}
            onClick={handleImport}
          >
            Import
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          All Customers
        </h2>

        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : customers.length === 0 ? (
          <p className="text-sm text-gray-500">No customers yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-600">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Email</th>
                  <th className="pb-2 pr-4 font-medium">Phone</th>
                  <th className="pb-2 pr-4 font-medium">Tags</th>
                  <th className="pb-2 pr-4 font-medium">Last Booked</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium text-gray-900">
                      {customer.name}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {customer.email || "--"}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {customer.phone || "--"}
                    </td>
                    <td className="py-3 pr-4">
                      {customer.tags ? (
                        <div className="flex flex-wrap gap-1">
                          {customer.tags.split(",").map((tag, i) => (
                            <Badge key={i} variant="default">
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">--</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {formatDate(customer.lastBookedAt)}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => populateForm(customer)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(customer.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
