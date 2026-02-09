"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  message: string | null;
  source: string;
  status: string;
  notes: string | null;
  assignedTo: string | null;
  createdAt: string;
}

interface Counts {
  total: number;
  new: number;
  contacted: number;
  qualified: number;
  converted: number;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-amber-100 text-amber-700",
  QUALIFIED: "bg-purple-100 text-purple-700",
  CONVERTED: "bg-green-100 text-green-700",
  LOST: "bg-gray-100 text-gray-500",
};

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/leads");
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads);
        setCounts(data.counts);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  async function updateLead(id: string, status: string) {
    setSaving(true);
    try {
      await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      fetchLeads();
    } finally {
      setSaving(false);
    }
  }

  async function saveNotes(id: string) {
    setSaving(true);
    try {
      await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, notes }),
      });
      fetchLeads();
      setSelectedLead(null);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-gray-700" />
          <div className="h-64 rounded-lg bg-gray-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Inbound Prospects</h1>
        <p className="mt-1 text-sm text-gray-400">
          Leads from the marketing site &mdash; &quot;Talk to our team&quot; and &quot;Book a demo&quot; submissions.
        </p>
      </div>

      {/* KPI cards */}
      {counts && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {[
            { label: "Total", value: counts.total, color: "text-white" },
            { label: "New", value: counts.new, color: "text-blue-400" },
            { label: "Contacted", value: counts.contacted, color: "text-amber-400" },
            { label: "Qualified", value: counts.qualified, color: "text-purple-400" },
            { label: "Converted", value: counts.converted, color: "text-green-400" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-lg bg-gray-800/50 border border-gray-700/50 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">{kpi.label}</p>
              <p className={`mt-1 text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Leads table */}
      <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700/50 text-left text-xs uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  No inbound leads yet. They&apos;ll appear here when someone fills out the contact form.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="border-b border-gray-700/30 hover:bg-gray-800/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{lead.name}</div>
                    <div className="text-xs text-gray-500">{lead.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{lead.company || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-300">
                      {lead.source}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={lead.status}
                      onChange={(e) => updateLead(lead.id, e.target.value)}
                      disabled={saving}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold border-0 cursor-pointer ${STATUS_COLORS[lead.status] || "bg-gray-100 text-gray-600"}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {format(new Date(lead.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setSelectedLead(lead); setNotes(lead.notes || ""); }}
                      className="text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Lead detail slide-over */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedLead(null)} />
          <div className="relative w-full max-w-md bg-gray-900 border-l border-gray-700 p-6 overflow-y-auto">
            <button onClick={() => setSelectedLead(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-lg font-bold text-white">{selectedLead.name}</h2>
            <p className="text-sm text-gray-400">{selectedLead.email}</p>
            {selectedLead.phone && <p className="text-sm text-gray-400">{selectedLead.phone}</p>}
            {selectedLead.company && (
              <p className="mt-1 text-sm text-gray-300">{selectedLead.company}</p>
            )}

            {selectedLead.message && (
              <div className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Message</h3>
                <p className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">{selectedLead.message}</p>
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Internal Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-indigo-500 focus:outline-none"
                placeholder="Add internal notes..."
              />
              <button
                onClick={() => saveNotes(selectedLead.id)}
                disabled={saving}
                className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Notes"}
              </button>
            </div>

            <div className="mt-6 text-xs text-gray-500">
              Submitted {format(new Date(selectedLead.createdAt), "MMMM d, yyyy 'at' h:mm a")}
              {" "}via {selectedLead.source}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
