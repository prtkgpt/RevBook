"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

/* ─── types ──────────────────────────────────────────────── */

interface TimeWindow {
  start: string;
  end: string;
}
type WeeklyHours = Record<string, TimeWindow[]>;

interface Template {
  id: string;
  name: string;
  durationMinutes: number;
  capacity: number;
  basePriceCents: number;
  color: string;
  weeklyHours: string;
  daysInAdvance: number;
  minNoticeHours: number;
  bufferMinutes: number;
  enabled: boolean;
}

const DAYS = [
  { key: "0", label: "S", full: "Sunday" },
  { key: "1", label: "M", full: "Monday" },
  { key: "2", label: "T", full: "Tuesday" },
  { key: "3", label: "W", full: "Wednesday" },
  { key: "4", label: "T", full: "Thursday" },
  { key: "5", label: "F", full: "Friday" },
  { key: "6", label: "S", full: "Saturday" },
];

const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90, 120];
const BUFFER_OPTIONS = [0, 5, 10, 15, 30];
const ADVANCE_OPTIONS = [7, 14, 30, 60, 90, 180, 365];
const NOTICE_OPTIONS = [1, 2, 4, 8, 12, 24, 48];

const COLORS = [
  "#4f46e5", "#7c3aed", "#db2777", "#dc2626",
  "#ea580c", "#d97706", "#16a34a", "#0891b2",
];

function formatMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

/* ─── collapsible section ──────────────────────────────────── */

function Section({
  title,
  summary,
  defaultOpen,
  children,
}: {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);

  return (
    <div className="border-t border-gray-100">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-5 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div>
          <div className="text-base font-semibold text-gray-900">{title}</div>
          {!open && summary && (
            <div className="mt-0.5 text-sm text-gray-500">{summary}</div>
          )}
        </div>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}

/* ─── page ───────────────────────────────────────────────── */

export default function EventTypeEditorPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [capacity, setCapacity] = useState(1);
  const [basePriceDollars, setBasePriceDollars] = useState("25.00");
  const [color, setColor] = useState("#4f46e5");
  const [daysInAdvance, setDaysInAdvance] = useState(60);
  const [minNoticeHours, setMinNoticeHours] = useState(4);
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours>({
    "0": [],
    "1": [{ start: "09:00", end: "17:00" }],
    "2": [{ start: "09:00", end: "17:00" }],
    "3": [{ start: "09:00", end: "17:00" }],
    "4": [{ start: "09:00", end: "17:00" }],
    "5": [{ start: "09:00", end: "17:00" }],
    "6": [],
  });

  const fetchTemplate = useCallback(async () => {
    try {
      const res = await fetch(`/api/event-types/${id}`);
      if (!res.ok) {
        toast.error("Event type not found");
        router.push("/app/event-types");
        return;
      }
      const t: Template = await res.json();
      setName(t.name);
      setDurationMinutes(t.durationMinutes);
      setCapacity(t.capacity);
      setBasePriceDollars((t.basePriceCents / 100).toFixed(2));
      setColor(t.color);
      setDaysInAdvance(t.daysInAdvance);
      setMinNoticeHours(t.minNoticeHours);
      setBufferMinutes(t.bufferMinutes);
      setEnabled(t.enabled);
      setWeeklyHours(JSON.parse(t.weeklyHours));
    } catch {
      toast.error("Failed to load event type");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (!isNew) fetchTemplate();
  }, [isNew, fetchTemplate]);

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        durationMinutes,
        capacity,
        basePriceCents: Math.round(parseFloat(basePriceDollars) * 100),
        color,
        weeklyHours: JSON.stringify(weeklyHours),
        daysInAdvance,
        minNoticeHours,
        bufferMinutes,
        enabled,
      };

      const url = isNew ? "/api/event-types" : `/api/event-types/${id}`;
      const method = isNew ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save");
        return;
      }

      const saved = await res.json();
      toast.success(isNew ? "Event type created" : "Changes saved");

      if (isNew) {
        router.push(`/app/event-types/${saved.id}`);
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate() {
    if (isNew) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/event-types/${id}/generate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to generate slots");
        return;
      }
      toast.success(`Generated ${data.created} new slots`);
    } catch {
      toast.error("Failed to generate slots");
    } finally {
      setGenerating(false);
    }
  }

  // Weekly hours helpers
  function updateWindow(day: string, idx: number, field: "start" | "end", value: string) {
    setWeeklyHours((prev) => {
      const windows = [...(prev[day] || [])];
      windows[idx] = { ...windows[idx], [field]: value };
      return { ...prev, [day]: windows };
    });
  }

  function addWindow(day: string) {
    setWeeklyHours((prev) => ({
      ...prev,
      [day]: [...(prev[day] || []), { start: "09:00", end: "17:00" }],
    }));
  }

  function removeWindow(day: string, idx: number) {
    setWeeklyHours((prev) => ({
      ...prev,
      [day]: (prev[day] || []).filter((_, i) => i !== idx),
    }));
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-[600px] rounded-2xl bg-gray-100" />
        </div>
      </div>
    );
  }

  const activeDays = Object.entries(weeklyHours).filter(
    ([, w]) => w.length > 0
  ).length;

  return (
    <div className="mx-auto max-w-2xl py-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.push("/app/event-types")}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </button>

        {!isNew && (
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <div
                className={`relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors ${
                  enabled ? "bg-indigo-600" : "bg-gray-300"
                }`}
                onClick={() => setEnabled(!enabled)}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    enabled ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </div>
              {enabled ? "Active" : "Disabled"}
            </label>
          </div>
        )}
      </div>

      {/* Editor card */}
      <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
        {/* ─ Event Type Header ─ */}
        <div className="px-6 pt-6 pb-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-2">
            Event type
          </div>
          <div className="flex items-start gap-3">
            {/* Color picker */}
            <div className="relative mt-1">
              <div
                className="h-8 w-8 rounded-full cursor-pointer ring-2 ring-white shadow"
                style={{ backgroundColor: color }}
              />
              <div className="absolute top-10 left-0 z-10 hidden group-focus-within:flex flex-wrap gap-1 rounded-lg border bg-white p-2 shadow-lg">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="h-6 w-6 rounded-full"
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
            <div className="flex-1">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Event name (e.g. Haircut, Consultation)"
                className="w-full border-0 p-0 text-xl font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          {/* Color swatches */}
          <div className="mt-3 flex items-center gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-5 w-5 rounded-full transition-all ${
                  color === c
                    ? "ring-2 ring-offset-1 ring-gray-400 scale-110"
                    : "hover:scale-110"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* ─ Duration ─ */}
        <Section
          title="Duration"
          summary={formatMinutes(durationMinutes)}
        >
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDurationMinutes(d)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  durationMinutes === d
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {formatMinutes(d)}
              </button>
            ))}
          </div>
        </Section>

        {/* ─ Pricing & Capacity ─ */}
        <Section
          title="Pricing & Capacity"
          summary={`$${basePriceDollars} · ${capacity} spot${capacity !== 1 ? "s" : ""}`}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Base Price
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={basePriceDollars}
                  onChange={(e) => setBasePriceDollars(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 py-2.5 pl-7 pr-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Capacity per slot
              </label>
              <input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
                className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                Max bookings per time slot
              </p>
            </div>
          </div>
        </Section>

        {/* ─ Availability ─ */}
        <Section
          title="Availability"
          summary={`${activeDays} day${activeDays !== 1 ? "s" : ""} · ${daysInAdvance} days ahead`}
          defaultOpen
        >
          {/* Date range + notice */}
          <div className="mb-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <span>Clients can schedule</span>
              <select
                value={daysInAdvance}
                onChange={(e) => setDaysInAdvance(Number(e.target.value))}
                className="rounded-lg border border-gray-300 py-1.5 px-2 text-sm font-medium text-indigo-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              >
                {ADVANCE_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} days
                  </option>
                ))}
              </select>
              <span>into the future with at least</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <select
                value={minNoticeHours}
                onChange={(e) => setMinNoticeHours(Number(e.target.value))}
                className="rounded-lg border border-gray-300 py-1.5 px-2 text-sm font-medium text-indigo-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              >
                {NOTICE_OPTIONS.map((h) => (
                  <option key={h} value={h}>
                    {h} hour{h !== 1 ? "s" : ""}
                  </option>
                ))}
              </select>
              <span>notice</span>
            </div>
          </div>

          {/* Buffer between slots */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Buffer between slots
            </label>
            <div className="flex flex-wrap gap-2">
              {BUFFER_OPTIONS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBufferMinutes(b)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                    bufferMinutes === b
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {b === 0 ? "None" : `${b} min`}
                </button>
              ))}
            </div>
          </div>

          {/* Weekly hours */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H4.598a.75.75 0 00-.75.75v3.634a.75.75 0 001.5 0v-2.033l.312.311a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.064-7.806a.75.75 0 00-.562.488A5.5 5.5 0 016.613 6.572l.312.311H4.492a.75.75 0 000 1.5h3.634a.75.75 0 00.75-.75V3.999a.75.75 0 00-1.5 0v2.033l-.312-.311A7 7 0 0118.776 8.86a.75.75 0 00-1.449-.39.75.75 0 00-.951-.852z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-semibold text-gray-900">
                Weekly hours
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Set when you&apos;re available for appointments
            </p>

            <div className="space-y-3">
              {DAYS.map((day) => {
                const windows = weeklyHours[day.key] || [];
                const isActive = windows.length > 0;

                return (
                  <div key={day.key} className="flex items-start gap-3">
                    {/* Day badge */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isActive) {
                          setWeeklyHours((prev) => ({
                            ...prev,
                            [day.key]: [],
                          }));
                        } else {
                          addWindow(day.key);
                        }
                      }}
                      title={
                        isActive
                          ? `Disable ${day.full}`
                          : `Enable ${day.full}`
                      }
                      className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                        isActive
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                      }`}
                    >
                      {day.label}
                    </button>

                    {/* Time windows */}
                    <div className="flex-1 space-y-2">
                      {windows.length === 0 ? (
                        <div className="py-2 text-sm text-gray-400">
                          Unavailable
                        </div>
                      ) : (
                        windows.map((w, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="time"
                              value={w.start}
                              onChange={(e) =>
                                updateWindow(
                                  day.key,
                                  idx,
                                  "start",
                                  e.target.value
                                )
                              }
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                              type="time"
                              value={w.end}
                              onChange={(e) =>
                                updateWindow(
                                  day.key,
                                  idx,
                                  "end",
                                  e.target.value
                                )
                              }
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                            />
                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() =>
                                removeWindow(day.key, idx)
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              <svg
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                              </svg>
                            </button>
                            {/* Add another window */}
                            <button
                              type="button"
                              onClick={() => addWindow(day.key)}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                            >
                              <svg
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                              </svg>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        {/* ─ Bottom toolbar ─ */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50/80 px-6 py-4">
          <div className="flex items-center gap-4">
            {!isNew && (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors disabled:opacity-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H4.598a.75.75 0 00-.75.75v3.634a.75.75 0 001.5 0v-2.033l.312.311a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.064-7.806a.75.75 0 00-.562.488A5.5 5.5 0 016.613 6.572l.312.311H4.492a.75.75 0 000 1.5h3.634a.75.75 0 00.75-.75V3.999a.75.75 0 00-1.5 0v2.033l-.312-.311A7 7 0 0018.776 8.86a.75.75 0 00-1.449-.39.75.75 0 00-.951-.852z"
                    clipRule="evenodd"
                  />
                </svg>
                {generating ? "Generating..." : "Generate Slots"}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md active:scale-[0.97] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
