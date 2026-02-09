"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Slot {
  id: string;
  serviceType: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  spotsLeft: number;
  basePriceCents: number;
  currentPriceCents: number;
  discountPercent: number;
  hasDiscount: boolean;
}

interface BusinessInfo {
  name: string;
}

interface BookingConfirmation {
  serviceType: string;
  date: string;
  time: string;
  priceCents: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function groupSlotsByDate(slots: Slot[]): Record<string, Slot[]> {
  const groups: Record<string, Slot[]> = {};
  for (const slot of slots) {
    const dateKey = format(new Date(slot.startTime), "yyyy-MM-dd");
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(slot);
  }
  return groups;
}

/* ------------------------------------------------------------------ */
/*  Skeleton Card                                                      */
/* ------------------------------------------------------------------ */

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-28 rounded bg-gray-200" />
        <div className="h-5 w-40 rounded bg-gray-200" />
        <div className="flex items-center gap-3">
          <div className="h-4 w-20 rounded bg-gray-200" />
          <div className="h-4 w-16 rounded bg-gray-200" />
        </div>
        <div className="h-10 w-full rounded-lg bg-gray-200" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function PublicBookingPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  const [slots, setSlots] = useState<Slot[]>([]);
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Which slot has the booking form open
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);

  // Booking form state
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Confirmation state
  const [confirmation, setConfirmation] =
    useState<BookingConfirmation | null>(null);

  /* ── Fetch slots ──────────────────────────────────────────────── */

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/${slug}/slots`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load available slots");
      }
      const data = await res.json();
      setSlots(data.slots ?? data);
      if (data.business) setBusiness(data.business);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  /* ── Update page title when business name loads ───────────────── */

  useEffect(() => {
    if (business?.name) {
      document.title = `Book with ${business.name} | RevBook`;
    }
  }, [business]);

  /* ── Handle booking ───────────────────────────────────────────── */

  async function handleBook(slot: Slot) {
    if (!customerName.trim() || !customerEmail.trim()) {
      toast.error("Please fill in your name and email.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/${slug}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: slot.id,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Booking failed. Please try again.");
      }

      setConfirmation({
        serviceType: slot.serviceType,
        date: format(new Date(slot.startTime), "EEEE, MMMM d, yyyy"),
        time: `${format(new Date(slot.startTime), "h:mm a")} – ${format(new Date(slot.endTime), "h:mm a")}`,
        priceCents: slot.currentPriceCents,
      });

      // Reset form
      setActiveSlotId(null);
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Booking failed";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Confirmation View ────────────────────────────────────────── */

  if (confirmation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-lg px-4 py-20">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            {/* Green checkmark */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-8 w-8 text-green-600"
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">
              Booking Confirmed!
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              You&apos;re all set. Here are your booking details.
            </p>

            <div className="mt-8 space-y-3 rounded-xl bg-gray-50 p-5 text-left text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Service</span>
                <span className="font-medium text-gray-900">
                  {confirmation.serviceType}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3">
                <span className="text-gray-500">Date</span>
                <span className="font-medium text-gray-900">
                  {confirmation.date}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3">
                <span className="text-gray-500">Time</span>
                <span className="font-medium text-gray-900">
                  {confirmation.time}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3">
                <span className="text-gray-500">Price</span>
                <span className="font-semibold text-green-600">
                  {formatCents(confirmation.priceCents)}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setConfirmation(null);
                fetchSlots();
              }}
              className="mt-8 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Book Another
            </button>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-gray-400">
            Powered by{" "}
            <a
              href="/"
              className="underline decoration-gray-300 underline-offset-2 transition-colors hover:text-gray-600"
            >
              RevBook
            </a>
          </p>
        </div>
      </div>
    );
  }

  /* ── Main View ────────────────────────────────────────────────── */

  const grouped = groupSlotsByDate(slots);
  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header / Branding ─────────────────────────────────────── */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-8 text-center sm:px-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6"
            >
              <path d="M12.75 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM7.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM8.25 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9.75 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM10.5 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM12.75 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM14.25 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
              <path
                fillRule="evenodd"
                d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {business?.name ?? "Book an Appointment"}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Choose a time that works for you and book instantly.
          </p>
        </div>
      </header>

      {/* ── Content ───────────────────────────────────────────────── */}
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* Loading state */}
        {loading && (
          <div className="space-y-8">
            {/* Fake date header */}
            <div>
              <div className="mb-4 h-5 w-44 animate-pulse rounded bg-gray-200" />
              <div className="grid gap-4 sm:grid-cols-2">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-sm font-medium text-red-800">{error}</p>
            <button
              onClick={fetchSlots}
              className="mt-4 text-sm font-semibold text-red-600 underline underline-offset-2 hover:text-red-700"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && slots.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white py-20 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-7 w-7 text-indigo-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                />
              </svg>
            </div>
            <p className="text-base font-medium text-gray-900">
              No available slots right now
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Check back later for new openings.
            </p>
          </div>
        )}

        {/* Slots grouped by date */}
        {!loading && !error && slots.length > 0 && (
          <div className="space-y-10">
            {sortedDates.map((dateKey) => (
              <section key={dateKey}>
                <h2 className="mb-4 text-base font-semibold text-gray-900">
                  {format(new Date(dateKey + "T00:00:00"), "EEEE, MMMM d, yyyy")}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {grouped[dateKey].map((slot) => (
                    <div
                      key={slot.id}
                      className="rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="p-5">
                        {/* Service type */}
                        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                          {slot.serviceType}
                        </p>

                        {/* Time range */}
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          {format(new Date(slot.startTime), "h:mm a")}
                          {" – "}
                          {format(new Date(slot.endTime), "h:mm a")}
                        </p>

                        {/* Spots left */}
                        <p className="mt-1 text-sm text-gray-500">
                          {slot.spotsLeft}{" "}
                          {slot.spotsLeft === 1 ? "spot" : "spots"} left
                        </p>

                        {/* Price */}
                        <div className="mt-3 flex items-center gap-2">
                          {slot.hasDiscount ? (
                            <>
                              <span className="text-sm text-gray-400 line-through">
                                {formatCents(slot.basePriceCents)}
                              </span>
                              <span className="text-lg font-bold text-green-600">
                                {formatCents(slot.currentPriceCents)}
                              </span>
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                                {slot.discountPercent}% off
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-gray-900">
                              {formatCents(slot.basePriceCents)}
                            </span>
                          )}
                        </div>

                        {/* Book Now button */}
                        {activeSlotId !== slot.id && (
                          <button
                            onClick={() => {
                              setActiveSlotId(slot.id);
                              setCustomerName("");
                              setCustomerEmail("");
                              setCustomerPhone("");
                            }}
                            className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                          >
                            Book Now
                          </button>
                        )}
                      </div>

                      {/* Inline booking form */}
                      {activeSlotId === slot.id && (
                        <div className="border-t border-gray-100 bg-gray-50/50 p-5">
                          <h3 className="mb-4 text-sm font-semibold text-gray-900">
                            Your details
                          </h3>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleBook(slot);
                            }}
                            className="space-y-3"
                          >
                            <div>
                              <label
                                htmlFor={`name-${slot.id}`}
                                className="block text-xs font-medium text-gray-700"
                              >
                                Full name <span className="text-red-400">*</span>
                              </label>
                              <input
                                id={`name-${slot.id}`}
                                type="text"
                                required
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Jane Smith"
                                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={`email-${slot.id}`}
                                className="block text-xs font-medium text-gray-700"
                              >
                                Email <span className="text-red-400">*</span>
                              </label>
                              <input
                                id={`email-${slot.id}`}
                                type="email"
                                required
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                placeholder="jane@example.com"
                                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={`phone-${slot.id}`}
                                className="block text-xs font-medium text-gray-700"
                              >
                                Phone{" "}
                                <span className="text-gray-400">(optional)</span>
                              </label>
                              <input
                                id={`phone-${slot.id}`}
                                type="tel"
                                value={customerPhone}
                                onChange={(e) =>
                                  setCustomerPhone(e.target.value)
                                }
                                placeholder="(555) 123-4567"
                                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                              />
                            </div>
                            <div className="flex gap-2 pt-1">
                              <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {submitting ? (
                                  <span className="inline-flex items-center gap-2">
                                    <svg
                                      className="h-4 w-4 animate-spin"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      />
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                      />
                                    </svg>
                                    Booking...
                                  </span>
                                ) : (
                                  "Confirm Booking"
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveSlotId(null)}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-8 text-center">
        <p className="text-xs text-gray-400">
          Powered by{" "}
          <a
            href="/"
            className="underline decoration-gray-300 underline-offset-2 transition-colors hover:text-gray-600"
          >
            RevBook
          </a>
        </p>
      </footer>
    </div>
  );
}
