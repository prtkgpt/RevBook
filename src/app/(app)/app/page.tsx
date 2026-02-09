"use client";

import { useEffect, useState, useCallback } from "react";
import { format, differenceInHours, addDays } from "date-fns";
import { Card } from "@/components/ui/card";
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

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upcoming 7 days of slots with health status and discount offers
        </p>
      </div>

      {sortedDates.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500">
            No upcoming slots in the next 7 days.
          </p>
        </Card>
      ) : (
        sortedDates.map((dateKey) => {
          const daySlots = slotsByDate[dateKey].sort(
            (a, b) =>
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          );

          return (
            <div key={dateKey} className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-800">
                {format(new Date(dateKey + "T00:00:00"), "EEEE, MMMM d, yyyy")}
              </h2>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {daySlots.map((slot) => {
                  const startDate = new Date(slot.startTime);
                  const endDate = new Date(slot.endTime);
                  const hoursUntil = differenceInHours(startDate, now);
                  const health = getSlotHealth(
                    slot.bookedCount,
                    slot.capacity,
                    hoursUntil
                  );
                  const activeOffer = slot.offers.find(
                    (o) => o.status !== "EXPIRED" && o.status !== "CLAIMED"
                  );

                  return (
                    <Card key={slot.id} className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {slot.serviceType}
                          </p>
                          <p className="text-sm text-gray-500">
                            {format(startDate, "h:mm a")} -{" "}
                            {format(endDate, "h:mm a")}
                          </p>
                        </div>
                        <Badge variant={healthBadgeVariant(health)}>
                          {health.replace("_", " ")}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          Capacity: {slot.bookedCount}/{slot.capacity}
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatCents(slot.basePriceCents)}
                        </span>
                      </div>

                      {activeOffer && (
                        <div className="rounded-md border border-gray-100 bg-gray-50 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500">
                              Rule: {activeOffer.rule.name}
                            </span>
                            <Badge
                              variant={
                                activeOffer.disabledByUser
                                  ? "default"
                                  : "info"
                              }
                            >
                              {activeOffer.disabledByUser
                                ? "Disabled"
                                : "Active"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              {activeOffer.discountPercent}% off
                            </span>
                            <span className="font-medium text-green-700">
                              {formatCents(activeOffer.discountedPriceCents)}
                            </span>
                          </div>
                          <Button
                            variant={
                              activeOffer.disabledByUser
                                ? "primary"
                                : "secondary"
                            }
                            size="sm"
                            className="w-full"
                            loading={togglingOffer === activeOffer.id}
                            onClick={() => toggleOffer(activeOffer)}
                          >
                            {activeOffer.disabledByUser
                              ? "Enable Offer"
                              : "Disable Offer"}
                          </Button>
                        </div>
                      )}

                      {!activeOffer && (
                        <p className="text-xs text-gray-400">
                          No active offer
                        </p>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
