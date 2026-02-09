"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";

interface EventType {
  id: string;
  name: string;
  durationMinutes: number;
  capacity: number;
  basePriceCents: number;
  color: string;
  enabled: boolean;
  daysInAdvance: number;
  weeklyHours: string;
  lastGeneratedAt: string | null;
  _count: { slots: number };
}

function formatMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

function formatCents(c: number): string {
  return `$${(c / 100).toFixed(2)}`;
}

function countActiveDays(weeklyHoursJson: string): number {
  try {
    const wh = JSON.parse(weeklyHoursJson);
    return Object.values(wh).filter(
      (w) => Array.isArray(w) && w.length > 0
    ).length;
  } catch {
    return 0;
  }
}

export default function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchEventTypes = useCallback(async () => {
    try {
      const res = await fetch("/api/event-types");
      if (!res.ok) {
        toast.error("Failed to load event types");
        return;
      }
      setEventTypes(await res.json());
    } catch {
      toast.error("Failed to load event types");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEventTypes();
  }, [fetchEventTypes]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This will not remove already-generated slots.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/event-types/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete");
        return;
      }
      toast.success("Event type deleted");
      setEventTypes((prev) => prev.filter((t) => t.id !== id));
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  }

  async function handleGenerate(id: string) {
    try {
      const res = await fetch(`/api/event-types/${id}/generate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to generate");
        return;
      }
      toast.success(`Generated ${data.created} new slots`);
    } catch {
      toast.error("Failed to generate");
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Event Types
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            Define your services and availability. Slots are automatically generated from these templates.
          </p>
        </div>

        <Link
          href="/app/event-types/new"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md active:scale-[0.97]"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          New Event Type
        </Link>
      </div>

      {/* Event type cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-gray-200/80 bg-white p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-5 w-32 rounded bg-gray-200" />
                  <div className="mt-1 h-3 w-20 rounded bg-gray-100" />
                </div>
              </div>
              <div className="h-4 w-full rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : eventTypes.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
            <svg
              className="h-7 w-7 text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900">
            No event types yet
          </p>
          <p className="mt-1 max-w-xs text-sm text-gray-500">
            Create your first event type to define your services and weekly availability. Slots will be generated automatically.
          </p>
          <Link
            href="/app/event-types/new"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            New Event Type
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {eventTypes.map((et) => (
            <div
              key={et.id}
              className="group relative rounded-2xl border border-gray-200/80 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-gray-300"
            >
              {/* Color stripe */}
              <div
                className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
                style={{ backgroundColor: et.color }}
              />

              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <Link href={`/app/event-types/${et.id}`} className="flex items-center gap-3 flex-1">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-bold"
                    style={{ backgroundColor: et.color }}
                  >
                    {et.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {et.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatMinutes(et.durationMinutes)} · {formatCents(et.basePriceCents)}
                    </div>
                  </div>
                </Link>

                {/* Status dot */}
                <span
                  className={`mt-1 h-2.5 w-2.5 rounded-full ${
                    et.enabled ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                  title={et.enabled ? "Active" : "Disabled"}
                />
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5.25 12a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H6a.75.75 0 01-.75-.75V12zM6 13.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V14a.75.75 0 00-.75-.75H6zM7.25 12a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H8a.75.75 0 01-.75-.75V12zM8 13.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V14a.75.75 0 00-.75-.75H8z" />
                    <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
                  </svg>
                  {countActiveDays(et.weeklyHours)} days/week
                </span>
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M1 8.25a1.25 1.25 0 112.5 0v7.5a1.25 1.25 0 11-2.5 0v-7.5zM7.25 3a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5zM11.5 12.75a1.25 1.25 0 112.5 0v3a1.25 1.25 0 11-2.5 0v-3z" />
                  </svg>
                  {et._count.slots} slots
                </span>
                <span>
                  {et.capacity} spot{et.capacity !== 1 ? "s" : ""}/slot
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
                <Link
                  href={`/app/event-types/${et.id}`}
                  className="flex-1 rounded-lg bg-gray-100 py-2 text-center text-xs font-medium text-gray-700 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleGenerate(et.id)}
                  className="flex-1 rounded-lg bg-gray-100 py-2 text-center text-xs font-medium text-gray-700 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                >
                  Generate
                </button>
                <button
                  onClick={() => handleDelete(et.id, et.name)}
                  disabled={deleting === et.id}
                  className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 01.7.8l-.5 5.5a.75.75 0 01-1.49-.14l.5-5.5a.75.75 0 01.79-.66Zm2.84 0a.75.75 0 01.79.66l.5 5.5a.75.75 0 01-1.49.14l-.5-5.5a.75.75 0 01.7-.8Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
