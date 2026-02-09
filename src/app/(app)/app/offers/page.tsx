"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";

type OfferStatus = "DRAFT" | "SENT" | "CLAIMED" | "EXPIRED";

interface Offer {
  id: string;
  slotId: string;
  ruleId: string;
  businessId: string;
  discountPercent: number;
  discountedPriceCents: number;
  status: OfferStatus;
  disabledByUser: boolean;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  slot: {
    id: string;
    serviceType: string;
    startTime: string;
    endTime: string;
    basePriceCents: number;
  };
  rule: {
    id: string;
    name: string;
  };
}

type FilterTab = "ALL" | OfferStatus;

const STATUS_BADGE_MAP: Record<OfferStatus, { label: string; variant: "default" | "info" | "success" | "danger" }> = {
  DRAFT: { label: "Draft", variant: "default" },
  SENT: { label: "Sent", variant: "info" },
  CLAIMED: { label: "Claimed", variant: "success" },
  EXPIRED: { label: "Expired", variant: "danger" },
};

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "DRAFT", label: "Draft" },
  { key: "SENT", label: "Sent" },
  { key: "CLAIMED", label: "Claimed" },
  { key: "EXPIRED", label: "Expired" },
];

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("ALL");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchOffers = useCallback(async () => {
    try {
      const res = await fetch("/api/offers");
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to load offers");
        return;
      }
      const data = await res.json();
      setOffers(data);
    } catch {
      toast.error("Something went wrong loading offers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  async function toggleDisabled(offer: Offer) {
    setTogglingId(offer.id);
    try {
      const res = await fetch(`/api/offers/${offer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabledByUser: !offer.disabledByUser }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update offer");
        return;
      }

      setOffers((prev) =>
        prev.map((o) =>
          o.id === offer.id ? { ...o, disabledByUser: !o.disabledByUser } : o
        )
      );
      toast.success(
        offer.disabledByUser ? "Offer re-enabled" : "Offer disabled"
      );
    } catch {
      toast.error("Something went wrong");
    } finally {
      setTogglingId(null);
    }
  }

  const filteredOffers =
    filter === "ALL" ? offers : offers.filter((o) => o.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Offers</h1>
      </div>

      <Card>
        {/* Filter tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200 pb-4">
          {FILTER_TABS.map((tab) => {
            const count =
              tab.key === "ALL"
                ? offers.length
                : offers.filter((o) => o.status === tab.key).length;
            return (
              <Button
                key={tab.key}
                variant={filter === tab.key ? "primary" : "ghost"}
                size="sm"
                onClick={() => setFilter(tab.key)}
              >
                {tab.label} ({count})
              </Button>
            );
          })}
        </div>

        {/* Table */}
        {loading ? (
          <p className="py-8 text-center text-sm text-gray-500">
            Loading offers...
          </p>
        ) : filteredOffers.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            No offers found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="pb-3 pr-4">Slot Time</th>
                  <th className="pb-3 pr-4">Service Type</th>
                  <th className="pb-3 pr-4">Rule</th>
                  <th className="pb-3 pr-4">Discount</th>
                  <th className="pb-3 pr-4">Discounted Price</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Disabled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOffers.map((offer) => {
                  const badge = STATUS_BADGE_MAP[offer.status];
                  return (
                    <tr key={offer.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap py-3 pr-4 text-gray-900">
                        {format(new Date(offer.slot.startTime), "MMM d, yyyy h:mm a")}
                      </td>
                      <td className="py-3 pr-4 text-gray-700">
                        {offer.slot.serviceType}
                      </td>
                      <td className="py-3 pr-4 text-gray-700">
                        {offer.rule.name}
                      </td>
                      <td className="py-3 pr-4 text-gray-700">
                        {offer.discountPercent}%
                      </td>
                      <td className="py-3 pr-4 text-gray-700">
                        {formatPrice(offer.discountedPriceCents)}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Button
                          variant={offer.disabledByUser ? "danger" : "secondary"}
                          size="sm"
                          loading={togglingId === offer.id}
                          onClick={() => toggleDisabled(offer)}
                        >
                          {offer.disabledByUser ? "Disabled" : "Enabled"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
