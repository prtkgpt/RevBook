"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BusinessData {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  description: string | null;
  primaryColor: string | null;
  bookingBaseUrl: string | null;
  stripeAccountId: string | null;
  stripeOnboarded: boolean;
}

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  hasPassword: boolean;
}

interface StripeStatus {
  configured: boolean;
  onboarded: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "America/Phoenix", "America/Anchorage",
  "Pacific/Honolulu", "Europe/London", "Europe/Paris",
  "Asia/Tokyo", "Australia/Sydney",
];

/* ------------------------------------------------------------------ */
/*  Section Card component                                             */
/* ------------------------------------------------------------------ */

function Section({ title, description, children }: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-5">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [description, setDescription] = useState("");
  const [userName, setUserName] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Slug check
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);

  /* ── Load settings ──────────────────────────────────────────────── */

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to load settings");
      const data = await res.json();

      setBusiness(data.business);
      setUser(data.user);
      setName(data.business.name);
      setSlug(data.business.slug);
      setTimezone(data.business.timezone);
      setDescription(data.business.description || "");
      setUserName(data.user.name || "");
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStripeStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/stripe/connect");
      if (res.ok) {
        const data = await res.json();
        setStripeStatus(data);
      }
    } catch {
      // Stripe status is optional
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadStripeStatus();
  }, [loadSettings, loadStripeStatus]);

  // Handle Stripe return
  useEffect(() => {
    const stripeParam = searchParams.get("stripe");
    if (stripeParam === "success") {
      toast.success("Stripe account connected!");
      loadStripeStatus();
    } else if (stripeParam === "refresh") {
      toast("Stripe setup needs to be completed. Try again.");
    }
  }, [searchParams, loadStripeStatus]);

  /* ── Slug availability check ────────────────────────────────────── */

  useEffect(() => {
    if (!slug || slug === business?.slug) {
      setSlugAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSlugChecking(true);
      try {
        const res = await fetch(`/api/public/${slug}/slots`);
        setSlugAvailable(res.status === 404);
      } catch {
        setSlugAvailable(null);
      } finally {
        setSlugChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [slug, business?.slug]);

  /* ── Save business settings ─────────────────────────────────────── */

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, timezone, description, userName }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save settings");
        return;
      }

      toast.success("Settings saved!");
      loadSettings();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  /* ── Save password ──────────────────────────────────────────────── */

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to set password");
        return;
      }

      toast.success(user?.hasPassword ? "Password updated!" : "Password set!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      loadSettings();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setPasswordSaving(false);
    }
  }

  /* ── Connect Stripe ─────────────────────────────────────────────── */

  async function handleStripeConnect() {
    setStripeLoading(true);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to start Stripe setup");
        return;
      }

      window.location.href = data.url;
    } catch {
      toast.error("Something went wrong");
    } finally {
      setStripeLoading(false);
    }
  }

  /* ── Copy booking URL ───────────────────────────────────────────── */

  function copyBookingUrl() {
    if (!business?.slug) return;
    const url = `${window.location.origin}/book/${business.slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Booking URL copied!");
  }

  /* ── Loading skeleton ───────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-4 w-64 rounded bg-gray-200" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl border border-gray-200 bg-white" />
          ))}
        </div>
      </div>
    );
  }

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your business profile, booking page, payments, and account security.
        </p>
      </div>

      <div className="space-y-6">
        {/* ── Business Profile ─────────────────────────────────────── */}
        <Section title="Business Profile" description="Your public-facing business information.">
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Business name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-all hover:border-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Tell customers about your business..."
                className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-all hover:border-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                Timezone
              </label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-all hover:border-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700">
                Your name
              </label>
              <input
                id="userName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your full name"
                className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-all hover:border-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <p className="mt-1 text-xs text-gray-500">
                {user?.email}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Section>

        {/* ── Booking URL ──────────────────────────────────────────── */}
        <Section title="Booking Page URL" description="Customize your public booking link.">
          <div className="space-y-4">
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                URL slug
              </label>
              <div className="mt-1.5 flex items-center gap-0 rounded-lg border border-gray-300 bg-white shadow-sm transition-all hover:border-gray-400 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
                <span className="whitespace-nowrap pl-3.5 text-sm text-gray-400">
                  revbookapp.com/book/
                </span>
                <input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={(e) =>
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                  }
                  required
                  className="flex-1 border-0 bg-transparent px-1 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-0"
                />
              </div>
              {slug !== business?.slug && (
                <p className="mt-1.5 text-xs">
                  {slugChecking ? (
                    <span className="text-gray-400">Checking availability...</span>
                  ) : slugAvailable === true ? (
                    <span className="text-green-600">This URL is available</span>
                  ) : slugAvailable === false ? (
                    <span className="text-red-600">This URL is already taken</span>
                  ) : null}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
              <div className="flex-1 truncate text-sm font-medium text-gray-700">
                {typeof window !== "undefined" ? window.location.origin : "https://revbookapp.com"}/book/{slug || "your-slug"}
              </div>
              <button
                type="button"
                onClick={copyBookingUrl}
                className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                Copy link
              </button>
            </div>
          </div>
        </Section>

        {/* ── Stripe Payments ──────────────────────────────────────── */}
        <Section title="Payments" description="Accept online payments from customers via Stripe.">
          {stripeStatus?.onboarded ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">Stripe is connected</p>
                  <p className="text-xs text-green-600">Payments are enabled on your booking page.</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Manage your Stripe account at{" "}
                <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline underline-offset-2">
                  dashboard.stripe.com
                </a>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Connect your Stripe account to accept payments directly on your booking page.
                RevBook charges a 5% platform fee on each transaction.
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleStripeConnect}
                  disabled={stripeLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#635bff] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#5851db] disabled:opacity-60"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
                  </svg>
                  {stripeLoading ? "Connecting..." : "Connect with Stripe"}
                </button>
                {stripeStatus?.configured && !stripeStatus.onboarded && (
                  <span className="text-xs text-amber-600">Setup incomplete — click to continue</span>
                )}
              </div>
            </div>
          )}
        </Section>

        {/* ── Password ─────────────────────────────────────────────── */}
        <Section
          title={user?.hasPassword ? "Change Password" : "Set Password"}
          description={
            user?.hasPassword
              ? "Update your account password."
              : "Set a password to sign in with email + password instead of magic links."
          }
        >
          <form onSubmit={handlePassword} className="space-y-4">
            {user?.hasPassword && (
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Current password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-all hover:border-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Minimum 8 characters"
                className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-all hover:border-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-all hover:border-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={passwordSaving}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-60"
              >
                {passwordSaving ? "Saving..." : user?.hasPassword ? "Update Password" : "Set Password"}
              </button>
            </div>
          </form>
        </Section>

        {/* ── Danger Zone ──────────────────────────────────────────── */}
        <Section title="Account" description="Signed in via magic link or password.">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              <p className="text-xs text-gray-500">
                {user?.hasPassword ? "Password + magic link enabled" : "Magic link only"}
              </p>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
