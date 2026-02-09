"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { format } from "date-fns";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
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
    <div className="space-y-8">
      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Slots
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            Create and manage your appointment slots, or bulk-import from a CSV
            file.
          </p>
        </div>

        <div className="shrink-0">
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
            {/* Upload / arrow-up-tray icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z"
              />
              <path
                d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z"
              />
            </svg>
            Import CSV
          </Button>
        </div>
      </div>

      {/* ── Create Slot Form ─────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Add new slot</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                hint="Number of bookings this slot can hold"
                required
              />

              {/* Price input with $ prefix */}
              <div className="space-y-1.5">
                <label
                  htmlFor="basePriceDollars"
                  className="block text-sm font-medium text-gray-700"
                >
                  Base Price
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm text-gray-400">
                    $
                  </span>
                  <input
                    id="basePriceDollars"
                    type="number"
                    min="0"
                    step="0.01"
                    value={basePriceDollars}
                    onChange={(e) => setBasePriceDollars(e.target.value)}
                    placeholder="25.00"
                    required
                    className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-8 pr-3.5 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 hover:border-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Price before any discounts
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-5">
              <Button type="submit" loading={submitting}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>
                Create Slot
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* ── Slots Table ──────────────────────────────────────────── */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Service Type</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Capacity</th>
                <th>Booked</th>
                <th>Base Price</th>
                <th>Status</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                /* ── Loading skeleton rows ──────────────────────── */
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={`skel-${i}`}>
                    <td>
                      <div className="skeleton h-4 w-24 rounded" />
                    </td>
                    <td>
                      <div className="skeleton h-4 w-36 rounded" />
                    </td>
                    <td>
                      <div className="skeleton h-4 w-36 rounded" />
                    </td>
                    <td>
                      <div className="skeleton h-4 w-10 rounded" />
                    </td>
                    <td>
                      <div className="skeleton h-4 w-10 rounded" />
                    </td>
                    <td>
                      <div className="skeleton h-4 w-16 rounded" />
                    </td>
                    <td>
                      <div className="skeleton h-5 w-16 rounded-full" />
                    </td>
                    <td>
                      <div className="skeleton h-7 w-8 rounded" />
                    </td>
                  </tr>
                ))
              ) : slots.length === 0 ? (
                /* ── Empty state ────────────────────────────────── */
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      {/* Calendar icon */}
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="h-7 w-7 text-indigo-400"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                          />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        No slots yet
                      </p>
                      <p className="mt-1 max-w-xs text-sm text-gray-500">
                        Get started by creating your first slot above, or
                        bulk-import from a CSV file.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                slots.map((slot) => (
                  <tr key={slot.id}>
                    <td className="font-medium text-gray-900">
                      {slot.serviceType}
                    </td>
                    <td>
                      {format(new Date(slot.startTime), "MMM d, yyyy h:mm a")}
                    </td>
                    <td>
                      {format(new Date(slot.endTime), "MMM d, yyyy h:mm a")}
                    </td>
                    <td>{slot.capacity}</td>
                    <td>
                      <span className="tabular-nums">
                        {slot.bookedCount}
                        <span className="text-gray-400">
                          {" "}
                          / {slot.capacity}
                        </span>
                      </span>
                    </td>
                    <td className="tabular-nums font-medium text-gray-900">
                      {formatCents(slot.basePriceCents)}
                    </td>
                    <td>
                      <Badge
                        variant={STATUS_VARIANT[slot.status] || "default"}
                      >
                        {slot.status}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={deleting === slot.id}
                        onClick={() => handleDelete(slot.id)}
                        className="text-gray-400 hover:text-rose-600"
                      >
                        {/* Trash icon */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-4 w-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 1 .7.8l-.5 5.5a.75.75 0 0 1-1.49-.14l.5-5.5a.75.75 0 0 1 .79-.66Zm2.84 0a.75.75 0 0 1 .79.66l.5 5.5a.75.75 0 0 1-1.49.14l-.5-5.5a.75.75 0 0 1 .7-.8Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </Button>
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
