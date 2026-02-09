"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { toast } from "sonner";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const STEPS = [
  { label: "Business info", active: true },
  { label: "Slots", active: false },
  { label: "Rules", active: false },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { update } = useSession();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [bookingBaseUrl, setBookingBaseUrl] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, timezone, bookingBaseUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create business");
        return;
      }

      toast.success("Business created!");
      // Refresh JWT so businessId is available
      await update();
      router.push("/app");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <Card>
          <CardBody className="space-y-8 px-8 py-10 sm:px-10">
            {/* ---------- Header with icon ---------- */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
                <svg
                  className="h-7 w-7 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Welcome to RevBook
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Let&apos;s set up your business in just a few steps. You&apos;ll
                be managing slots and offers in no time.
              </p>
            </div>

            {/* ---------- Progress indicator ---------- */}
            <div className="flex items-center justify-center gap-3">
              {STEPS.map((step, i) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        step.active
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        step.active ? "text-indigo-600" : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="h-px w-8 bg-gray-200" />
                  )}
                </div>
              ))}
            </div>

            {/* ---------- Divider ---------- */}
            <div className="h-px w-full bg-gray-100" />

            {/* ---------- Form ---------- */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Business name"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Salon"
                required
                hint="This is how your business will appear to customers."
              />

              <div className="space-y-1.5">
                <label
                  htmlFor="timezone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Timezone
                </label>
                <select
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 hover:border-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  Used to display slot times in your local timezone.
                </p>
              </div>

              <Input
                label="External booking URL"
                id="bookingBaseUrl"
                value={bookingBaseUrl}
                onChange={(e) => setBookingBaseUrl(e.target.value)}
                placeholder="https://calendly.com/your-business"
                hint="Optional. Link to your external booking page."
              />

              {/* ---------- Submit ---------- */}
              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  loading={loading}
                >
                  Create Business
                </Button>
              </div>

              <p className="text-center text-xs text-gray-400">
                You can update these settings at any time from your dashboard.
              </p>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
