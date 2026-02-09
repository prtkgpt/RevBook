"use client";

import { useState } from "react";

export default function OnboardClientPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ slug: string; email: string } | null>(null);
  const [error, setError] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, slug, ownerName, ownerEmail, ownerPassword, timezone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account");
        return;
      }

      setSuccess({ slug: data.business.slug, email: data.user.email });
      setBusinessName("");
      setSlug("");
      setOwnerName("");
      setOwnerEmail("");
      setOwnerPassword("");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Onboard New Client</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a business account and owner user for a new B2B customer.
        </p>
      </div>

      <div className="max-w-lg">
        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="font-medium text-green-800">Account created successfully!</p>
            <p className="mt-1 text-sm text-green-700">
              Booking page: revbookapp.com/book/{success.slug}
            </p>
            <p className="text-sm text-green-700">
              Owner can sign in at revbookapp.com/signin with {success.email}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Business Details</h2>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => { setBusinessName(e.target.value); setSlug(generateSlug(e.target.value)); }}
                required
                className="block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Acme Salon"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">URL Slug</label>
              <div className="flex items-center rounded-lg border border-gray-300 bg-white shadow-sm">
                <span className="pl-3.5 text-sm text-gray-500">revbookapp.com/book/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  required
                  className="flex-1 border-0 bg-transparent px-1 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-0"
                  placeholder="acme-salon"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Phoenix", "Europe/London", "Europe/Paris", "Asia/Tokyo", "Australia/Sydney"].map((tz) => (
                  <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Owner Account</h2>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Owner Name</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Jane Smith"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Owner Email</label>
              <input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                required
                className="block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="jane@acmesalon.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Password <span className="text-gray-400">(optional — they can use magic link)</span>
              </label>
              <input
                type="password"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                minLength={8}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Min 8 characters"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Business Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
