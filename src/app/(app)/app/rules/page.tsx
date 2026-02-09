"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface DiscountRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  hoursBeforeSlot: number | null;
  maxBookedPercent: number | null;
  daysOfWeek: string | null;
  afterTimeOfDay: string | null;
  beforeTimeOfDay: string | null;
  serviceTypes: string | null;
  discountPercent: number;
}

const DAY_LABELS = [
  { value: "1", label: "Mon" },
  { value: "2", label: "Tue" },
  { value: "3", label: "Wed" },
  { value: "4", label: "Thu" },
  { value: "5", label: "Fri" },
  { value: "6", label: "Sat" },
  { value: "7", label: "Sun" },
];

const EMPTY_FORM = {
  name: "",
  enabled: true,
  priority: 0,
  hoursBeforeSlot: "",
  maxBookedPercent: "",
  daysOfWeek: [] as string[],
  afterTimeOfDay: "",
  beforeTimeOfDay: "",
  serviceTypes: "",
  discountPercent: 10,
};

export default function RulesPage() {
  const [rules, setRules] = useState<DiscountRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch("/api/rules");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRules(data);
    } catch {
      toast.error("Failed to load rules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function populateForm(rule: DiscountRule) {
    setEditingId(rule.id);
    setForm({
      name: rule.name,
      enabled: rule.enabled,
      priority: rule.priority,
      hoursBeforeSlot: rule.hoursBeforeSlot?.toString() ?? "",
      maxBookedPercent: rule.maxBookedPercent?.toString() ?? "",
      daysOfWeek: rule.daysOfWeek ? rule.daysOfWeek.split(",") : [],
      afterTimeOfDay: rule.afterTimeOfDay ?? "",
      beforeTimeOfDay: rule.beforeTimeOfDay ?? "",
      serviceTypes: rule.serviceTypes ?? "",
      discountPercent: rule.discountPercent,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: form.name,
      enabled: form.enabled,
      priority: Number(form.priority),
      hoursBeforeSlot: form.hoursBeforeSlot ? Number(form.hoursBeforeSlot) : null,
      maxBookedPercent: form.maxBookedPercent ? Number(form.maxBookedPercent) : null,
      daysOfWeek: form.daysOfWeek.length > 0 ? form.daysOfWeek.join(",") : null,
      afterTimeOfDay: form.afterTimeOfDay || null,
      beforeTimeOfDay: form.beforeTimeOfDay || null,
      serviceTypes: form.serviceTypes || null,
      discountPercent: Number(form.discountPercent),
    };

    try {
      const url = editingId ? `/api/rules/${editingId}` : "/api/rules";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save rule");
        return;
      }

      toast.success(editingId ? "Rule updated" : "Rule created");
      resetForm();
      fetchRules();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleEnabled(rule: DiscountRule) {
    try {
      const res = await fetch(`/api/rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !rule.enabled }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(rule.enabled ? "Rule disabled" : "Rule enabled");
      fetchRules();
    } catch {
      toast.error("Failed to toggle rule");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this rule?")) return;
    try {
      const res = await fetch(`/api/rules/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Rule deleted");
      if (editingId === id) resetForm();
      fetchRules();
    } catch {
      toast.error("Failed to delete rule");
    }
  }

  function buildConditionPills(rule: DiscountRule): { label: string; key: string }[] {
    const pills: { label: string; key: string }[] = [];
    if (rule.hoursBeforeSlot != null) {
      pills.push({ label: `< ${rule.hoursBeforeSlot}h before`, key: "hours" });
    }
    if (rule.maxBookedPercent != null) {
      pills.push({ label: `< ${rule.maxBookedPercent}% booked`, key: "booked" });
    }
    if (rule.daysOfWeek) {
      const dayNames = rule.daysOfWeek
        .split(",")
        .map((d) => DAY_LABELS.find((dl) => dl.value === d)?.label ?? d)
        .join(", ");
      pills.push({ label: dayNames, key: "days" });
    }
    if (rule.afterTimeOfDay) {
      pills.push({ label: `After ${rule.afterTimeOfDay}`, key: "after" });
    }
    if (rule.beforeTimeOfDay) {
      pills.push({ label: `Before ${rule.beforeTimeOfDay}`, key: "before" });
    }
    if (rule.serviceTypes) {
      pills.push({ label: rule.serviceTypes, key: "types" });
    }
    return pills;
  }

  return (
    <div className="space-y-8">
      {/* ── Page Header ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Discount Rules
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-gray-500">
          Configure automatic discounts that apply when specific conditions are
          met.
        </p>
      </div>

      {/* ── Create / Edit Form ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {editingId ? (
              /* Pencil-square icon */
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4 text-amber-600"
                >
                  <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                  <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25h5.5a.75.75 0 0 0 0-1.5h-5.5A2.75 2.75 0 0 0 2 5.75v8.5A2.75 2.75 0 0 0 4.75 17h8.5A2.75 2.75 0 0 0 16 14.25v-5.5a.75.75 0 0 0-1.5 0v5.5c0 .69-.56 1.25-1.25 1.25h-8.5c-.69 0-1.25-.56-1.25-1.25v-8.5Z" />
                </svg>
              </div>
            ) : (
              /* Plus-circle icon */
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4 text-indigo-600"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? "Edit rule" : "Create rule"}
            </h2>
          </div>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1 -- name & priority */}
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Rule name"
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Early bird discount"
                required
              />
              <Input
                label="Priority"
                id="priority"
                type="number"
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: Number(e.target.value) })
                }
                hint="Higher values run first"
              />
            </div>

            {/* Enabled toggle styled as a pill button */}
            <div className="space-y-1.5">
              <span className="block text-sm font-medium text-gray-700">
                Status
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={form.enabled}
                onClick={() => setForm({ ...form, enabled: !form.enabled })}
                className={
                  "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 " +
                  (form.enabled ? "bg-indigo-600" : "bg-gray-200")
                }
              >
                <span
                  className={
                    "pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 " +
                    (form.enabled ? "translate-x-5" : "translate-x-0")
                  }
                />
              </button>
              <p className="text-xs text-gray-500">
                {form.enabled
                  ? "This rule is active"
                  : "This rule is currently disabled"}
              </p>
            </div>

            {/* Row 2 -- conditions: hours before & max booked */}
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Hours before slot"
                id="hoursBeforeSlot"
                type="number"
                min={1}
                value={form.hoursBeforeSlot}
                onChange={(e) =>
                  setForm({ ...form, hoursBeforeSlot: e.target.value })
                }
                placeholder="e.g. 24"
                hint="Optional -- trigger when fewer than N hours remain"
              />
              <Input
                label="Max booked %"
                id="maxBookedPercent"
                type="number"
                min={0}
                max={100}
                value={form.maxBookedPercent}
                onChange={(e) =>
                  setForm({ ...form, maxBookedPercent: e.target.value })
                }
                placeholder="e.g. 50"
                hint="Optional -- trigger when occupancy is below this %"
              />
            </div>

            {/* Days of week -- pill-style toggles */}
            <div className="space-y-2">
              <span className="block text-sm font-medium text-gray-700">
                Days of week
                <span className="ml-1.5 text-xs font-normal text-gray-400">
                  (optional)
                </span>
              </span>
              <div className="flex flex-wrap gap-2">
                {DAY_LABELS.map((day) => {
                  const selected = form.daysOfWeek.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => {
                        const next = selected
                          ? form.daysOfWeek.filter((d) => d !== day.value)
                          : [...form.daysOfWeek, day.value];
                        setForm({ ...form, daysOfWeek: next });
                      }}
                      className={
                        "inline-flex h-9 w-12 items-center justify-center rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 " +
                        (selected
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200")
                      }
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 3 -- time window */}
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="After time of day"
                id="afterTimeOfDay"
                type="time"
                value={form.afterTimeOfDay}
                onChange={(e) =>
                  setForm({ ...form, afterTimeOfDay: e.target.value })
                }
                hint="Optional -- slot must start after this time"
              />
              <Input
                label="Before time of day"
                id="beforeTimeOfDay"
                type="time"
                value={form.beforeTimeOfDay}
                onChange={(e) =>
                  setForm({ ...form, beforeTimeOfDay: e.target.value })
                }
                hint="Optional -- slot must start before this time"
              />
            </div>

            {/* Service types */}
            <Input
              label="Service types"
              id="serviceTypes"
              value={form.serviceTypes}
              onChange={(e) =>
                setForm({ ...form, serviceTypes: e.target.value })
              }
              placeholder="haircut, massage"
              hint="Optional -- comma-separated list of service types this rule applies to"
            />

            {/* Discount percent with visual indicator */}
            <div className="space-y-1.5">
              <label
                htmlFor="discountPercent"
                className="block text-sm font-medium text-gray-700"
              >
                Discount
              </label>
              <div className="relative">
                <input
                  id="discountPercent"
                  type="number"
                  min={1}
                  max={100}
                  value={form.discountPercent}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      discountPercent: Number(e.target.value),
                    })
                  }
                  required
                  className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-3.5 pr-10 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 hover:border-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-sm font-medium text-gray-400">
                  %
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Percentage off the base price (1 -- 100)
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
              {editingId && (
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Cancel
                </Button>
              )}
              <Button type="submit" loading={saving}>
                {editingId ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Save Changes
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                    </svg>
                    Create Rule
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* ── Rules Table ──────────────────────────────────────────── */}
      <Card className="p-0">
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">All rules</h2>
        </CardHeader>

        {loading ? (
          /* ── Loading skeleton ───────────────────────────────── */
          <div className="divide-y divide-gray-100 px-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`skel-${i}`} className="flex items-center gap-4 py-5">
                <div className="skeleton h-4 w-40 rounded" />
                <div className="skeleton h-5 w-10 rounded-full" />
                <div className="skeleton ml-auto h-4 w-24 rounded" />
              </div>
            ))}
          </div>
        ) : rules.length === 0 ? (
          /* ── Empty state ────────────────────────────────────── */
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
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
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">
              No discount rules yet
            </p>
            <p className="mt-1 max-w-xs text-sm text-gray-500">
              Create your first rule above to start offering automatic
              discounts.
            </p>
          </div>
        ) : (
          <div className="table-container rounded-none border-x-0 border-b-0 shadow-none">
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Priority</th>
                    <th>Conditions</th>
                    <th>Discount</th>
                    <th>Status</th>
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => {
                    const pills = buildConditionPills(rule);
                    return (
                      <tr key={rule.id}>
                        <td className="font-medium text-gray-900">
                          {rule.name}
                        </td>
                        <td>
                          <Badge variant="default">{rule.priority}</Badge>
                        </td>
                        <td>
                          {pills.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {pills.map((pill) => (
                                <span
                                  key={pill.key}
                                  className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-200"
                                >
                                  {pill.label}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">
                              No conditions
                            </span>
                          )}
                        </td>
                        <td>
                          <Badge variant="info">
                            {rule.discountPercent}% off
                          </Badge>
                        </td>
                        <td>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={rule.enabled}
                            onClick={() => handleToggleEnabled(rule)}
                            className={
                              "relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 " +
                              (rule.enabled ? "bg-indigo-600" : "bg-gray-200")
                            }
                          >
                            <span
                              className={
                                "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 " +
                                (rule.enabled
                                  ? "translate-x-4"
                                  : "translate-x-0")
                              }
                            />
                          </button>
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            {/* Edit icon button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => populateForm(rule)}
                              className="text-gray-400 hover:text-indigo-600"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="h-4 w-4"
                              >
                                <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25h5.5a.75.75 0 0 0 0-1.5h-5.5A2.75 2.75 0 0 0 2 5.75v8.5A2.75 2.75 0 0 0 4.75 17h8.5A2.75 2.75 0 0 0 16 14.25v-5.5a.75.75 0 0 0-1.5 0v5.5c0 .69-.56 1.25-1.25 1.25h-8.5c-.69 0-1.25-.56-1.25-1.25v-8.5Z" />
                              </svg>
                            </Button>
                            {/* Delete icon button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(rule.id)}
                              className="text-gray-400 hover:text-rose-600"
                            >
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
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
