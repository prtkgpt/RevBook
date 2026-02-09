"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  pricePaidCents: number;
  originalPriceCents: number;
  discountPercent: number;
  createdAt: string;
  slot: {
    serviceType: string;
    startTime: string;
    endTime: string;
  };
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings");
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to load bookings");
        return;
      }
      const data = await res.json();
      setBookings(data);
    } catch {
      toast.error("Something went wrong loading bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSlug = useCallback(async () => {
    try {
      const res = await fetch("/api/business/slug");
      if (!res.ok) return;
      const data = await res.json();
      setSlug(data.slug);
    } catch {
      // Silently fail — slug display is non-critical
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    fetchSlug();
  }, [fetchBookings, fetchSlug]);

  function getBookingUrl(): string {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/book/${slug}`;
  }

  async function copyBookingUrl() {
    const url = getBookingUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Booking link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Page header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Bookings
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Recent bookings from your public booking page.
          </p>
        </div>

        {/* Booking count stat */}
        {!loading && (
          <div className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 ring-1 ring-inset ring-indigo-600/10">
            <svg
              className="h-4.5 w-4.5 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
              />
            </svg>
            <span className="text-sm font-semibold text-indigo-700">
              {bookings.length}
            </span>
            <span className="text-sm text-indigo-600">
              {bookings.length === 1 ? "booking" : "bookings"} total
            </span>
          </div>
        )}
      </div>

      {/* ── Public booking link ── */}
      {slug && (
        <Card>
          <CardBody>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                  <svg
                    className="h-5 w-5 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Your public booking page
                  </p>
                  <p className="text-sm text-indigo-600 break-all">
                    {getBookingUrl()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={copyBookingUrl}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50"
              >
                {copied ? (
                  <>
                    <svg
                      className="h-4 w-4 text-emerald-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
                      />
                    </svg>
                    Copy link
                  </>
                )}
              </button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Bookings table ── */}
      {loading ? (
        /* Skeleton loading state */
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Service</th>
                <th>Date & Time</th>
                <th>Price</th>
                <th>Discount</th>
                <th>Booked</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td>
                    <div className="space-y-2">
                      <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                      <div className="h-3 w-40 animate-pulse rounded bg-gray-100" />
                    </div>
                  </td>
                  <td>
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                  </td>
                  <td>
                    <div className="space-y-2">
                      <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                      <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
                    </div>
                  </td>
                  <td>
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                  </td>
                  <td>
                    <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200" />
                  </td>
                  <td>
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : bookings.length === 0 ? (
        <div className="table-container">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <svg
                className="h-7 w-7 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z"
                />
              </svg>
            </div>
            <p className="mt-4 text-sm font-medium text-gray-900">
              No bookings yet
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Share your booking link to start receiving bookings.
            </p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Service</th>
                <th>Date & Time</th>
                <th>Price</th>
                <th>Discount</th>
                <th>Booked</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const hasDiscount = booking.discountPercent > 0;

                return (
                  <tr key={booking.id}>
                    {/* Customer name and email */}
                    <td>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {booking.customerName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {booking.customerEmail}
                        </span>
                      </div>
                    </td>

                    {/* Service type */}
                    <td className="text-gray-700">
                      {booking.slot.serviceType}
                    </td>

                    {/* Date and time */}
                    <td className="whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {format(
                            new Date(booking.slot.startTime),
                            "MMM d, yyyy"
                          )}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(booking.slot.startTime), "h:mm a")}{" "}
                          &ndash;{" "}
                          {format(new Date(booking.slot.endTime), "h:mm a")}
                        </span>
                      </div>
                    </td>

                    {/* Price: original crossed out if discounted, current in green */}
                    <td>
                      <div className="flex items-center gap-2">
                        {hasDiscount && (
                          <span className="text-sm text-gray-400 line-through">
                            {formatPrice(booking.originalPriceCents)}
                          </span>
                        )}
                        <span
                          className={`text-sm font-semibold ${
                            hasDiscount
                              ? "text-emerald-600"
                              : "text-gray-900"
                          }`}
                        >
                          {formatPrice(booking.pricePaidCents)}
                        </span>
                      </div>
                    </td>

                    {/* Discount badge */}
                    <td>
                      {hasDiscount ? (
                        <Badge variant="success">
                          {booking.discountPercent}% off
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-400">&mdash;</span>
                      )}
                    </td>

                    {/* Relative booking date */}
                    <td className="whitespace-nowrap text-sm text-gray-500">
                      {formatDistanceToNow(new Date(booking.createdAt), {
                        addSuffix: true,
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
