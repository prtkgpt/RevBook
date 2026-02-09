"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Slot {
  id: string;
  serviceType: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  basePriceCents: number;
  status: string;
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger"> = {
  OPEN: "success",
  FULL: "warning",
  CANCELLED: "danger",
};

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function SlotsPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [serviceType, setServiceType] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState("");
  const [basePriceDollars, setBasePriceDollars] = useState("");

  const fetchSlots = useCallback(async () => {
    try {
      const res = await fetch("/api/slots");
      if (!res.ok) {
        toast.error("Failed to load slots");
        return;
      }
      const data = await res.json();
      setSlots(data);
    } catch {
      toast.error("Failed to load slots");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const basePriceCents = Math.round(parseFloat(basePriceDollars) * 100);

      const res = await fetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType,
          startTime,
          endTime,
          capacity: parseInt(capacity, 10),
          basePriceCents,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(
          typeof data.error === "string"
            ? data.error
            : "Failed to create slot"
        );
        return;
      }

      toast.success("Slot created");
      setServiceType("");
      setStartTime("");
      setEndTime("");
      setCapacity("");
      setBasePriceDollars("");
      await fetchSlots();
    } catch {
      toast.error("Failed to create slot");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/slots/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete slot");
        return;
      }
      toast.success("Slot deleted");
      await fetchSlots();
    } catch {
      toast.error("Failed to delete slot");
    } finally {
      setDeleting(null);
    }
  }

  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import/slots", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Import failed");
        return;
      }

      toast.success(
        `Import complete: ${data.created} created, ${data.failed} failed out of ${data.total} rows`
      );
      await fetchSlots();
    } catch {
      toast.error("Import failed");
    } finally {
      setImporting(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Slots</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage your appointment slots
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleCsvImport}
            className="hidden"
            id="csv-import"
          />
          <Button
            variant="secondary"
            loading={importing}
            onClick={() => fileInputRef.current?.click()}
          >
            Import CSV
          </Button>
        </div>
      </div>

      {/* Create Slot Form */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Create New Slot
        </h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Service Type"
              id="serviceType"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              placeholder="e.g. Haircut, Massage"
              required
            />
            <Input
              label="Start Time"
              id="startTime"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <Input
              label="End Time"
              id="endTime"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
            <Input
              label="Capacity"
              id="capacity"
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="1"
              required
            />
            <Input
              label="Base Price ($)"
              id="basePriceDollars"
              type="number"
              min="0"
              step="0.01"
              value={basePriceDollars}
              onChange={(e) => setBasePriceDollars(e.target.value)}
              placeholder="25.00"
              required
            />
          </div>
          <Button type="submit" loading={submitting}>
            Create Slot
          </Button>
        </form>
      </Card>

      {/* Slots Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">
                  Service Type
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  Start Time
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  End Time
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  Capacity
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  Booked
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  Base Price
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  Status
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Loading slots...
                  </td>
                </tr>
              ) : slots.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No slots yet. Create one above or import a CSV.
                  </td>
                </tr>
              ) : (
                slots.map((slot) => (
                  <tr key={slot.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {slot.serviceType}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {format(new Date(slot.startTime), "MMM d, yyyy h:mm a")}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {format(new Date(slot.endTime), "MMM d, yyyy h:mm a")}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {slot.capacity}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {slot.bookedCount}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatCents(slot.basePriceCents)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[slot.status] || "default"}>
                        {slot.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="danger"
                        size="sm"
                        loading={deleting === slot.id}
                        onClick={() => handleDelete(slot.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
