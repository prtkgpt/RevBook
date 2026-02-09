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
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Onboard New Client</h1>
        <p className="mt-1 text-sm text-gray-400">
          Create a business account and owner user for a new B2B customer.
        </p>
      </div>

      <div className="max-w-lg">
        {success && (
          <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
            <p className="font-medium text-green-400">Account created successfully!</p>
            <p className="mt-1 text-sm text-green-300/80">
              Booking page: revbookapp.com/book/{success.slug}
            </p>
            <p className="text-sm text-green-300/80">
              Owner can sign in at revbookapp.com/signin with {success.email}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-300">Business Details</h2>

            <div>
              <label className="block text-xs font-medium text-gray-400">Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => { setBusinessName(e.target.value); setSlug(generateSlug(e.target.value)); }}
                required
                className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-indigo-500 focus:outline-none"
                placeholder="Acme Salon"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400">URL Slug</label>
              <div className="mt-1 flex items-center rounded-lg border border-gray-700 bg-gray-800">
                <span className="pl-3 text-xs text-gray-500">revbookapp.com/book/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  required
                  className="flex-1 border-0 bg-transparent px-1 py-2 text-sm font-medium text-white focus:outline-none focus:ring-0"
                  placeholder="acme-salon"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                {["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Phoenix", "Europe/London", "Europe/Paris", "Asia/Tokyo", "Australia/Sydney"].map((tz) => (
                  <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-300">Owner Account</h2>

            <div>
              <label className="block text-xs font-medium text-gray-400">Owner Name</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-indigo-500 focus:outline-none"
                placeholder="Jane Smith"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400">Owner Email</label>
              <input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-indigo-500 focus:outline-none"
                placeholder="jane@acmesalon.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400">
                Password <span className="text-gray-600">(optional — they can use magic link)</span>
              </label>
              <input
                type="password"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                minLength={8}
                className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-indigo-500 focus:outline-none"
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
