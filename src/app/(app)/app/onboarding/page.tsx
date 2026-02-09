"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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

export default function OnboardingPage() {
  const router = useRouter();
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
      router.push("/app");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <h1 className="mb-6 text-xl font-bold text-gray-900">Set up your business</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Business name"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Salon"
            required
          />

          <div className="space-y-1">
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
              Timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="External booking URL (optional)"
            id="bookingBaseUrl"
            value={bookingBaseUrl}
            onChange={(e) => setBookingBaseUrl(e.target.value)}
            placeholder="https://calendly.com/your-business"
          />

          <Button type="submit" className="w-full" loading={loading}>
            Create business
          </Button>
        </form>
      </Card>
    </div>
  );
}
