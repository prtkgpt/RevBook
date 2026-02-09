"use client";

import { useEffect, useState, useCallback } from "react";
import { format, differenceInHours, addDays } from "date-fns";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Offer {
  id: string;
  ruleId: string;
  discountPercent: number;
  discountedPriceCents: number;
  disabledByUser: boolean;
  status: string;
  rule: {
    name: string;
  };
}

interface Slot {
  id: string;
  serviceType: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  basePriceCents: number;
  status: string;
  offers: Offer[];
}

type HealthStatus = "HEALTHY" | "AT_RISK" | "LIKELY_EMPTY";

function getSlotHealth(
  bookedCount: number,
  capacity: number,
  hoursUntilSlot: number
): HealthStatus {
  const fillPercent = capacity > 0 ? (bookedCount / capacity) * 100 : 0;
  if (fillPercent >= 75) return "HEALTHY";
  if (fillPercent >= 25 || hoursUntilSlot > 48) return "AT_RISK";
  return "LIKELY_EMPTY";
}

function healthBadgeVariant(health: HealthStatus) {
  switch (health) {
    case "HEALTHY":
      return "success";
    case "AT_RISK":
      return "warning";
    case "LIKELY_EMPTY":
      return "danger";
  }
}

function healthLabel(health: HealthStatus) {
  switch (health) {
    case "HEALTHY":
      return "Healthy";
    case "AT_RISK":
      return "At Risk";
    case "LIKELY_EMPTY":
      return "Likely Empty";
  }
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/* ---------- Stat card icons (inline SVGs) ---------- */

function CalendarIcon() {
  return (
    <svg
      className="h-5 w-5"
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
  );
}

function ExclamationIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 6h.008v.008H6V6z"
      />
    </svg>
  );
}

function CurrencyIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
      />
    </svg>
  );
}

function EmptyStateIcon() {
  return (
    <svg
      className="mx-auto h-16 w-16 text-gray-300"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
      />
    </svg>
  );
}

/* ---------- Skeleton loading ---------- */

function SkeletonStatCard() {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-4">
          <div className="skeleton h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-6 w-16" />
            <div className="skeleton h-3 w-24" />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function SkeletonSlotCard() {
  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="skeleton h-5 w-32" />
            <div className="skeleton h-3 w-24" />
          </div>
          <div className="skeleton h-6 w-20 rounded-full" />
        </div>
        <div className="space-y-1.5">
          <div className="skeleton h-2 w-full rounded-full" />
          <div className="skeleton h-3 w-20" />
        </div>
        <div className="flex items-center justify-between">
          <div className="skeleton h-4 w-16" />
          <div className="skeleton h-4 w-16" />
        </div>
        <div className="skeleton h-20 w-full rounded-lg" />
      </CardBody>
    </Card>
  );
}

/* ---------- Toggle switch ---------- */

function ToggleSwitch({
  enabled,
  loading,
  onToggle,
}: {
  enabled: boolean;
  loading: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={loading}
      onClick={onToggle}
      className={`toggle-switch ${
        enabled ? "bg-indigo-600" : "bg-gray-200"
      } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`toggle-switch-dot ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/* ---------- Dashboard ---------- */

export default function DashboardPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingOffer, setTogglingOffer] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    try {
      const res = await fetch("/api/slots?dashboard=true");
      if (!res.ok) {
        toast.error("Failed to load dashboard");
        return;
      }
      const data = await res.json();
      setSlots(data);
    } catch {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  async function toggleOffer(offer: Offer) {
    setTogglingOffer(offer.id);
    try {
      const res = await fetch(`/api/offers/${offer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabledByUser: !offer.disabledByUser }),
      });
      if (!res.ok) {
        toast.error("Failed to toggle offer");
        return;
      }
      toast.success(
        offer.disabledByUser ? "Offer enabled" : "Offer disabled"
      );
      await fetchSlots();
    } catch {
      toast.error("Failed to toggle offer");
    } finally {
      setTogglingOffer(null);
    }
  }

  const now = new Date();
  const sevenDaysLater = addDays(now, 7);

  const upcomingSlots = slots.filter((slot) => {
    const start = new Date(slot.startTime);
    return start >= now && start <= sevenDaysLater;
  });

  // Group slots by date
  const slotsByDate = upcomingSlots.reduce<Record<string, Slot[]>>(
    (acc, slot) => {
      const dateKey = format(new Date(slot.startTime), "yyyy-MM-dd");
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(slot);
      return acc;
    },
    {}
  );

  const sortedDates = Object.keys(slotsByDate).sort();

  /* ---------- Compute stats ---------- */
  const totalSlots = upcomingSlots.length;
  const atRiskSlots = upcomingSlots.filter((s) => {
    const h = differenceInHours(new Date(s.startTime), now);
    const health = getSlotHealth(s.bookedCount, s.capacity, h);
    return health === "AT_RISK" || health === "LIKELY_EMPTY";
  }).length;
  const activeOffers = upcomingSlots.reduce(
    (count, s) =>
      count +
      s.offers.filter(
        (o) =>
          o.status !== "EXPIRED" &&
          o.status !== "CLAIMED" &&
          !o.disabledByUser
      ).length,
    0
  );
  const totalDiscountCents = upcomingSlots.reduce((sum, s) => {
    const active = s.offers.find(
      (o) =>
        o.status !== "EXPIRED" &&
        o.status !== "CLAIMED" &&
        !o.disabledByUser
    );
    if (active) {
      return sum + (s.basePriceCents - active.discountedPriceCents);
    }
    return sum;
  }, 0);

  /* ---------- Loading skeleton ---------- */
  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-80" />
        </div>

        {/* Stat cards skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>

        {/* Date header skeleton */}
        <div className="space-y-4">
          <div className="skeleton h-5 w-56" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonSlotCard />
            <SkeletonSlotCard />
            <SkeletonSlotCard />
          </div>
        </div>

        <div className="space-y-4">
          <div className="skeleton h-5 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonSlotCard />
            <SkeletonSlotCard />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ---------- Page header ---------- */}
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>
          Your upcoming 7-day overview with slot health and active discount
          offers.
        </p>
      </div>

      {/* ---------- Summary stat cards ---------- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total slots */}
        <Card hover>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <CalendarIcon />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-gray-900">
                  {totalSlots}
                </p>
                <p className="text-xs font-medium text-gray-500">
                  Total Slots
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* At-risk slots */}
        <Card hover>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <ExclamationIcon />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-gray-900">
                  {atRiskSlots}
                </p>
                <p className="text-xs font-medium text-gray-500">
                  At-Risk Slots
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Active offers */}
        <Card hover>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <TagIcon />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-gray-900">
                  {activeOffers}
                </p>
                <p className="text-xs font-medium text-gray-500">
                  Active Offers
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Total discount value */}
        <Card hover>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <CurrencyIcon />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-gray-900">
                  {formatCents(totalDiscountCents)}
                </p>
                <p className="text-xs font-medium text-gray-500">
                  Discount Value
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ---------- Slot grid by date ---------- */}
      {sortedDates.length === 0 ? (
        <Card>
          <CardBody className="py-16">
            <div className="flex flex-col items-center gap-4 text-center">
              <EmptyStateIcon />
              <div className="space-y-1">
                <p className="text-base font-semibold text-gray-900">
                  No upcoming slots
                </p>
                <p className="text-sm text-gray-500">
                  There are no scheduled slots in the next 7 days. Create some
                  slots to get started.
                </p>
              </div>
              <Button variant="primary" size="md" className="mt-2">
                Create a Slot
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-10">
          {sortedDates.map((dateKey) => {
            const daySlots = slotsByDate[dateKey].sort(
              (a, b) =>
                new Date(a.startTime).getTime() -
                new Date(b.startTime).getTime()
            );

            return (
              <div key={dateKey} className="space-y-4">
                {/* Date header */}
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight text-gray-900">
                    {format(
                      new Date(dateKey + "T00:00:00"),
                      "EEEE, MMMM d, yyyy"
                    )}
                  </h2>
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                    {daySlots.length} slot{daySlots.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Slot cards grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {daySlots.map((slot) => {
                    const startDate = new Date(slot.startTime);
                    const endDate = new Date(slot.endTime);
                    const hoursUntil = differenceInHours(startDate, now);
                    const health = getSlotHealth(
                      slot.bookedCount,
                      slot.capacity,
                      hoursUntil
                    );
                    const fillPercent =
                      slot.capacity > 0
                        ? Math.round(
                            (slot.bookedCount / slot.capacity) * 100
                          )
                        : 0;
                    const activeOffer = slot.offers.find(
                      (o) =>
                        o.status !== "EXPIRED" && o.status !== "CLAIMED"
                    );

                    return (
                      <Card key={slot.id} hover>
                        <CardBody className="space-y-4">
                          {/* Top row: service type + health badge */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate text-base font-semibold text-gray-900">
                                {slot.serviceType}
                              </h3>
                              <p className="mt-0.5 text-sm text-gray-500">
                                {format(startDate, "h:mm a")} &ndash;{" "}
                                {format(endDate, "h:mm a")}
                              </p>
                            </div>
                            <Badge variant={healthBadgeVariant(health)}>
                              {healthLabel(health)}
                            </Badge>
                          </div>

                          {/* Capacity bar */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-gray-600">
                                Capacity
                              </span>
                              <span className="font-semibold text-gray-900">
                                {slot.bookedCount} / {slot.capacity}
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  fillPercent >= 75
                                    ? "bg-emerald-500"
                                    : fillPercent >= 25
                                    ? "bg-amber-400"
                                    : "bg-rose-400"
                                }`}
                                style={{ width: `${fillPercent}%` }}
                              />
                            </div>
                          </div>

                          {/* Price */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500">
                              Price
                            </span>
                            <div className="flex items-center gap-2">
                              {activeOffer &&
                                !activeOffer.disabledByUser && (
                                  <span className="text-sm text-gray-400 line-through">
                                    {formatCents(slot.basePriceCents)}
                                  </span>
                                )}
                              <span className="text-sm font-bold text-gray-900">
                                {activeOffer && !activeOffer.disabledByUser
                                  ? formatCents(
                                      activeOffer.discountedPriceCents
                                    )
                                  : formatCents(slot.basePriceCents)}
                              </span>
                            </div>
                          </div>

                          {/* Active offer section */}
                          {activeOffer ? (
                            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
                                    <svg
                                      className="h-3.5 w-3.5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      strokeWidth={2}
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 6h.008v.008H6V6z"
                                      />
                                    </svg>
                                  </div>
                                  <span className="text-xs font-semibold text-gray-700">
                                    {activeOffer.rule.name}
                                  </span>
                                </div>
                                <Badge
                                  variant={
                                    activeOffer.disabledByUser
                                      ? "default"
                                      : "info"
                                  }
                                >
                                  {activeOffer.disabledByUser
                                    ? "Paused"
                                    : `${activeOffer.discountPercent}% off`}
                                </Badge>
                              </div>

                              {/* Toggle row */}
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  {activeOffer.disabledByUser
                                    ? "Offer paused"
                                    : "Offer active"}
                                </span>
                                <ToggleSwitch
                                  enabled={!activeOffer.disabledByUser}
                                  loading={togglingOffer === activeOffer.id}
                                  onToggle={() => toggleOffer(activeOffer)}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-3.5 py-3">
                              <svg
                                className="h-4 w-4 text-gray-300"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 6h.008v.008H6V6z"
                                />
                              </svg>
                              <span className="text-xs text-gray-400">
                                No active offer
                              </span>
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
