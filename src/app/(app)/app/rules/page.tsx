"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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

  function buildConditionsSummary(rule: DiscountRule): string {
    const parts: string[] = [];
    if (rule.hoursBeforeSlot != null) {
      parts.push(`<${rule.hoursBeforeSlot}h before`);
    }
    if (rule.maxBookedPercent != null) {
      parts.push(`<${rule.maxBookedPercent}% booked`);
    }
    if (rule.daysOfWeek) {
      const dayNames = rule.daysOfWeek
        .split(",")
        .map((d) => DAY_LABELS.find((dl) => dl.value === d)?.label ?? d)
        .join(", ");
      parts.push(dayNames);
    }
    if (rule.afterTimeOfDay) {
      parts.push(`after ${rule.afterTimeOfDay}`);
    }
    if (rule.beforeTimeOfDay) {
      parts.push(`before ${rule.beforeTimeOfDay}`);
    }
    if (rule.serviceTypes) {
      parts.push(`types: ${rule.serviceTypes}`);
    }
    return parts.length > 0 ? parts.join(" | ") : "No conditions";
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Discount Rules</h1>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {editingId ? "Edit Rule" : "Create Rule"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
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
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
              Enabled
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Hours before slot (optional)"
              id="hoursBeforeSlot"
              type="number"
              min={1}
              value={form.hoursBeforeSlot}
              onChange={(e) =>
                setForm({ ...form, hoursBeforeSlot: e.target.value })
              }
              placeholder="e.g. 24"
            />
            <Input
              label="Max booked % (optional, 0-100)"
              id="maxBookedPercent"
              type="number"
              min={0}
              max={100}
              value={form.maxBookedPercent}
              onChange={(e) =>
                setForm({ ...form, maxBookedPercent: e.target.value })
              }
              placeholder="e.g. 50"
            />
          </div>

          <div className="space-y-1">
            <span className="block text-sm font-medium text-gray-700">
              Days of week (optional)
            </span>
            <div className="flex flex-wrap gap-3">
              {DAY_LABELS.map((day) => (
                <label key={day.value} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={form.daysOfWeek.includes(day.value)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...form.daysOfWeek, day.value]
                        : form.daysOfWeek.filter((d) => d !== day.value);
                      setForm({ ...form, daysOfWeek: next });
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {day.label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="After time of day (optional)"
              id="afterTimeOfDay"
              type="time"
              value={form.afterTimeOfDay}
              onChange={(e) =>
                setForm({ ...form, afterTimeOfDay: e.target.value })
              }
            />
            <Input
              label="Before time of day (optional)"
              id="beforeTimeOfDay"
              type="time"
              value={form.beforeTimeOfDay}
              onChange={(e) =>
                setForm({ ...form, beforeTimeOfDay: e.target.value })
              }
            />
          </div>

          <Input
            label="Service types (optional, comma-separated)"
            id="serviceTypes"
            value={form.serviceTypes}
            onChange={(e) => setForm({ ...form, serviceTypes: e.target.value })}
            placeholder="haircut, massage"
          />

          <Input
            label="Discount % (1-100)"
            id="discountPercent"
            type="number"
            min={1}
            max={100}
            value={form.discountPercent}
            onChange={(e) =>
              setForm({ ...form, discountPercent: Number(e.target.value) })
            }
            required
          />

          <div className="flex gap-2">
            <Button type="submit" loading={saving}>
              {editingId ? "Update Rule" : "Create Rule"}
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
        <h2 className="mb-4 text-lg font-semibold text-gray-900">All Rules</h2>

        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : rules.length === 0 ? (
          <p className="text-sm text-gray-500">No discount rules yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-600">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Priority</th>
                  <th className="pb-2 pr-4 font-medium">Conditions</th>
                  <th className="pb-2 pr-4 font-medium">Discount</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium text-gray-900">
                      {rule.name}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{rule.priority}</td>
                    <td className="py-3 pr-4 text-gray-600">
                      {buildConditionsSummary(rule)}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant="info">{rule.discountPercent}%</Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => handleToggleEnabled(rule)}
                        className="cursor-pointer"
                      >
                        <Badge variant={rule.enabled ? "success" : "default"}>
                          {rule.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </button>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => populateForm(rule)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(rule.id)}
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
