"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface BookingInfo {
  customerName: string;
  customerEmail: string;
  pricePaidCents: number;
  originalPriceCents: number;
  discountPercent: number;
  paymentStatus: string;
  slot: {
    serviceType: string;
    startTime: string;
    endTime: string;
  };
  business: {
    name: string;
  };
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function BookingSuccessPage({
  params,
}: {
  params: { slug: string };
}) {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking");
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    fetch(`/api/public/${params.slug}/booking?id=${bookingId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setBooking(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookingId, params.slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-lg px-4 py-20">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-green-600">
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            {booking?.paymentStatus === "PAID" ? "Payment Confirmed!" : "Booking Confirmed!"}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {booking
              ? `Thank you, ${booking.customerName}. Your appointment is confirmed.`
              : "Your booking has been confirmed."}
          </p>

          {booking && (
            <div className="mt-8 space-y-3 rounded-xl bg-gray-50 p-5 text-left text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Business</span>
                <span className="font-medium text-gray-900">{booking.business.name}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3">
                <span className="text-gray-500">Service</span>
                <span className="font-medium text-gray-900">{booking.slot.serviceType}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3">
                <span className="text-gray-500">Date</span>
                <span className="font-medium text-gray-900">
                  {new Date(booking.slot.startTime).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3">
                <span className="text-gray-500">Time</span>
                <span className="font-medium text-gray-900">
                  {new Date(booking.slot.startTime).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" — "}
                  {new Date(booking.slot.endTime).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3">
                <span className="text-gray-500">Price</span>
                <span className="font-semibold text-green-600">
                  {formatCents(booking.pricePaidCents)}
                  {booking.discountPercent > 0 && (
                    <span className="ml-2 text-xs text-gray-400 line-through">
                      {formatCents(booking.originalPriceCents)}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3">
                <span className="text-gray-500">Confirmation sent to</span>
                <span className="font-medium text-gray-900">{booking.customerEmail}</span>
              </div>
            </div>
          )}

          <Link
            href={`/book/${params.slug}`}
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            Book Another Appointment
          </Link>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          Powered by{" "}
          <a href="/" className="underline decoration-gray-300 underline-offset-2 hover:text-gray-600">
            RevBook
          </a>
        </p>
      </div>
    </div>
  );
}
