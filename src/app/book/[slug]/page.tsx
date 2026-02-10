"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { format, addDays } from "date-fns";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EventType {
  id: string;
  name: string;
  durationMinutes: number;
  basePriceCents: number;
  color: string;
  availableDates: string[];
}

interface TimeSlot {
  id: string;
  serviceType: string;
  startTime: string;
  endTime: string;
  spotsLeft: number;
  basePriceCents: number;
  currentPriceCents: number;
  discountPercent: number;
  hasDiscount: boolean;
}

interface BusinessInfo {
  name: string;
}

type Step = "service" | "date" | "time" | "details" | "confirmed";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function generateDates(count: number): string[] {
  return Array.from({ length: count }, (_, i) =>
    format(addDays(new Date(), i), "yyyy-MM-dd")
  );
}

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className ?? "h-4 w-4"}
    >
      <path
        fillRule="evenodd"
        d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className ?? "h-4 w-4"}
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className ?? "h-5 w-5"}
    >
      <path
        fillRule="evenodd"
        d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className ?? "h-8 w-8"}
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className ?? "h-6 w-6"}
    >
      <path d="M12.75 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM7.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM8.25 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9.75 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM10.5 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM12.75 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM14.25 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
      <path
        fillRule="evenodd"
        d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Selection Badge                                                    */
/* ------------------------------------------------------------------ */

function SelectionBadge({
  color,
  label,
}: {
  color?: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
      {color && (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton Loaders                                                   */
/* ------------------------------------------------------------------ */

function ServiceSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-lg bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-gray-200" />
          <div className="h-3 w-24 rounded bg-gray-200" />
        </div>
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

  // Step navigation
  const [step, setStep] = useState<Step>("service");

  // Data
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selections
  const [selectedService, setSelectedService] = useState<EventType | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Form
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Confirmation
  const [confirmation, setConfirmation] = useState<{
    serviceType: string;
    date: string;
    time: string;
    priceCents: number;
  } | null>(null);

  // Date scroll ref
  const dateScrollRef = useRef<HTMLDivElement>(null);

  /* ── Fetch event types ───────────────────────────────────────── */

  const fetchEventTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/${slug}/event-types`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load services");
      }
      const data = await res.json();
      setEventTypes(data.eventTypes ?? []);
      if (data.business) setBusiness(data.business);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchEventTypes();
  }, [fetchEventTypes]);

  /* ── Fetch time slots for selected service + date ────────────── */

  const fetchTimeSlots = useCallback(
    async (templateId: string, date: string) => {
      setSlotsLoading(true);
      try {
        const res = await fetch(
          `/api/public/${slug}/slots?templateId=${templateId}&date=${date}`
        );
        if (!res.ok) throw new Error("Failed to load time slots");
        const data = await res.json();
        setTimeSlots(data.slots ?? []);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to load slots";
        toast.error(msg);
        setTimeSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    },
    [slug]
  );

  /* ── Handle booking ──────────────────────────────────────────── */

  async function handleBook() {
    if (!selectedSlot || !customerName.trim() || !customerEmail.trim()) {
      toast.error("Please fill in your name and email.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/stripe/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          slug,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Booking failed. Please try again.");
      }

      const data = await res.json();

      if (data.mode === "stripe" && data.url) {
        window.location.href = data.url;
        return;
      }

      // Direct booking success
      setConfirmation({
        serviceType: selectedSlot.serviceType,
        date: format(
          new Date(selectedSlot.startTime),
          "EEEE, MMMM d, yyyy"
        ),
        time: `${format(new Date(selectedSlot.startTime), "h:mm a")} – ${format(new Date(selectedSlot.endTime), "h:mm a")}`,
        priceCents: selectedSlot.currentPriceCents,
      });
      setStep("confirmed");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Booking failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Step handlers ───────────────────────────────────────────── */

  function selectService(service: EventType) {
    setSelectedService(service);
    setSelectedDate(null);
    setSelectedSlot(null);
    setTimeSlots([]);
    setStep("date");
  }

  function selectDate(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (selectedService) {
      fetchTimeSlots(selectedService.id, date);
    }
    setStep("time");
  }

  function selectTime(slot: TimeSlot) {
    setSelectedSlot(slot);
    setStep("details");
  }

  function goBack() {
    if (step === "date") {
      setStep("service");
      setSelectedService(null);
    } else if (step === "time") {
      setStep("date");
      setSelectedSlot(null);
    } else if (step === "details") {
      setStep("time");
      setSelectedSlot(null);
    }
  }

  function startOver() {
    setStep("service");
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setConfirmation(null);
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    fetchEventTypes();
  }

  /* ── Update page title ───────────────────────────────────────── */

  useEffect(() => {
    if (business?.name) {
      document.title = `Book with ${business.name} | RevBook`;
    }
  }, [business]);

  /* ── Scroll to first available date ──────────────────────────── */

  useEffect(() => {
    if (step === "date" && selectedService && dateScrollRef.current) {
      const firstAvailable = dateScrollRef.current.querySelector(
        "[data-available='true']"
      );
      if (firstAvailable) {
        firstAvailable.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [step, selectedService]);

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  /* ── Confirmed View ──────────────────────────────────────────── */

  if (step === "confirmed" && confirmation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-lg px-4 py-20">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
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
              onClick={startOver}
              className="mt-8 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Book Another
            </button>
          </div>

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

  /* ── Date helpers ────────────────────────────────────────────── */

  const allDates = generateDates(30);
  const availableSet = new Set(selectedService?.availableDates ?? []);

  /* ── Step progress ───────────────────────────────────────────── */

  const steps: { key: Step; label: string }[] = [
    { key: "service", label: "Service" },
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "details", label: "Confirm" },
  ];
  const stepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-6 text-center sm:px-6">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            {business?.name ?? "Book an Appointment"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {step === "service" && "Select a service to get started."}
            {step === "date" && "Pick a date that works for you."}
            {step === "time" && "Choose your preferred time."}
            {step === "details" && "Confirm your details to book."}
          </p>
        </div>
      </header>

      {/* ── Step indicator ─────────────────────────────────────── */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-center gap-1 px-4 py-3">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div
                className={`flex h-6 items-center rounded-full px-3 text-xs font-medium transition-colors ${
                  i === stepIndex
                    ? "bg-indigo-600 text-white"
                    : i < stepIndex
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                {s.label}
              </div>
              {i < steps.length - 1 && (
                <ChevronRightIcon className="mx-1 h-4 w-4 text-gray-300" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {/* Back button + selection badges */}
        {step !== "service" && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <button
              onClick={goBack}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              Back
            </button>
            {selectedService && (
              <SelectionBadge
                color={selectedService.color}
                label={selectedService.name}
              />
            )}
            {selectedDate && (
              <SelectionBadge
                label={format(
                  new Date(selectedDate + "T00:00:00"),
                  "EEE, MMM d"
                )}
              />
            )}
            {selectedSlot && (
              <SelectionBadge
                label={format(
                  new Date(selectedSlot.startTime),
                  "h:mm a"
                )}
              />
            )}
          </div>
        )}

        {/* ── Loading ────────────────────────────────────────── */}
        {loading && (
          <div className="space-y-3">
            <ServiceSkeleton />
            <ServiceSkeleton />
            <ServiceSkeleton />
          </div>
        )}

        {/* ── Error ──────────────────────────────────────────── */}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-sm font-medium text-red-800">{error}</p>
            <button
              onClick={fetchEventTypes}
              className="mt-4 text-sm font-semibold text-red-600 underline underline-offset-2 hover:text-red-700"
            >
              Try again
            </button>
          </div>
        )}

        {/* ── Empty state ────────────────────────────────────── */}
        {!loading && !error && eventTypes.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
              <CalendarIcon className="h-7 w-7 text-indigo-400" />
            </div>
            <p className="text-base font-medium text-gray-900">
              No services available right now
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Check back later for new openings.
            </p>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/*  STEP 1: Service Selection                            */}
        {/* ══════════════════════════════════════════════════════ */}
        {!loading && !error && step === "service" && eventTypes.length > 0 && (
          <div className="space-y-3">
            {eventTypes.map((et) => {
              const hasAvailability = et.availableDates.length > 0;
              return (
                <button
                  key={et.id}
                  onClick={() => hasAvailability && selectService(et)}
                  disabled={!hasAvailability}
                  className={`group flex w-full items-center gap-4 rounded-xl border bg-white p-4 text-left shadow-sm transition-all sm:p-5 ${
                    hasAvailability
                      ? "border-gray-200 hover:border-gray-300 hover:shadow-md"
                      : "cursor-not-allowed border-gray-100 opacity-50"
                  }`}
                >
                  {/* Color accent */}
                  <div
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: et.color }}
                  >
                    <ClockIcon className="h-6 w-6" />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-gray-900">
                      {et.name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                      <span>{et.durationMinutes} min</span>
                      <span className="text-gray-300">|</span>
                      <span className="font-medium text-gray-700">
                        {formatCents(et.basePriceCents)}
                      </span>
                      {!hasAvailability && (
                        <>
                          <span className="text-gray-300">|</span>
                          <span className="text-red-400">No availability</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  {hasAvailability && (
                    <ChevronRightIcon className="h-5 w-5 flex-shrink-0 text-gray-300 transition-colors group-hover:text-gray-500" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/*  STEP 2: Date Selection                               */}
        {/* ══════════════════════════════════════════════════════ */}
        {step === "date" && selectedService && (
          <div>
            {/* Month header for context */}
            <p className="mb-4 text-sm font-medium text-gray-500">
              Next 30 days
            </p>

            {/* Horizontal scrollable date strip */}
            <div
              ref={dateScrollRef}
              className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide"
              style={{ scrollbarWidth: "none" }}
            >
              {allDates.map((dateStr) => {
                const dateObj = new Date(dateStr + "T00:00:00");
                const isAvailable = availableSet.has(dateStr);
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
                const dayOfWeek = format(dateObj, "EEE");
                const dayNum = format(dateObj, "d");
                const month = format(dateObj, "MMM");

                return (
                  <button
                    key={dateStr}
                    data-available={isAvailable}
                    onClick={() => isAvailable && selectDate(dateStr)}
                    disabled={!isAvailable}
                    className={`flex flex-shrink-0 flex-col items-center rounded-xl px-3 py-3 text-center transition-all ${
                      isSelected
                        ? "text-white shadow-md"
                        : isAvailable
                          ? "border border-gray-200 bg-white text-gray-900 shadow-sm hover:border-gray-300 hover:shadow-md"
                          : "border border-transparent bg-gray-50 text-gray-300"
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: selectedService.color }
                        : undefined
                    }
                  >
                    <span
                      className={`text-[10px] font-medium uppercase tracking-wider ${
                        isSelected
                          ? "text-white/80"
                          : isAvailable
                            ? "text-gray-400"
                            : "text-gray-300"
                      }`}
                    >
                      {dayOfWeek}
                    </span>
                    <span
                      className={`mt-0.5 text-lg font-bold leading-tight ${
                        isSelected
                          ? "text-white"
                          : isAvailable
                            ? "text-gray-900"
                            : "text-gray-300"
                      }`}
                    >
                      {dayNum}
                    </span>
                    <span
                      className={`text-[10px] ${
                        isSelected
                          ? "text-white/80"
                          : isAvailable
                            ? "text-gray-400"
                            : "text-gray-300"
                      }`}
                    >
                      {month}
                    </span>
                    {isToday && isAvailable && !isSelected && (
                      <span
                        className="mt-1 h-1 w-1 rounded-full"
                        style={{ backgroundColor: selectedService.color }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* No availability notice */}
            {availableSet.size === 0 && (
              <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 text-center">
                <p className="text-sm font-medium text-gray-600">
                  No available dates for this service.
                </p>
                <button
                  onClick={goBack}
                  className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Choose a different service
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/*  STEP 3: Time Selection                               */}
        {/* ══════════════════════════════════════════════════════ */}
        {step === "time" && selectedService && selectedDate && (
          <div>
            {/* Loading */}
            {slotsLoading && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-xl border border-gray-200 bg-white p-4"
                  >
                    <div className="h-5 w-16 rounded bg-gray-200" />
                    <div className="mt-2 h-4 w-12 rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            )}

            {/* Time slots */}
            {!slotsLoading && timeSlots.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {timeSlots.map((slot) => {
                  const isSelected = selectedSlot?.id === slot.id;
                  return (
                    <button
                      key={slot.id}
                      onClick={() => selectTime(slot)}
                      className={`rounded-xl border p-4 text-left transition-all ${
                        isSelected
                          ? "border-transparent text-white shadow-md"
                          : "border-gray-200 bg-white shadow-sm hover:border-gray-300 hover:shadow-md"
                      }`}
                      style={
                        isSelected
                          ? { backgroundColor: selectedService.color }
                          : undefined
                      }
                    >
                      <p
                        className={`text-base font-semibold ${
                          isSelected ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {format(new Date(slot.startTime), "h:mm a")}
                      </p>

                      {/* Price */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {slot.hasDiscount ? (
                          <>
                            <span
                              className={`text-xs line-through ${
                                isSelected ? "text-white/60" : "text-gray-400"
                              }`}
                            >
                              {formatCents(slot.basePriceCents)}
                            </span>
                            <span
                              className={`text-sm font-bold ${
                                isSelected ? "text-white" : "text-green-600"
                              }`}
                            >
                              {formatCents(slot.currentPriceCents)}
                            </span>
                          </>
                        ) : (
                          <span
                            className={`text-sm font-medium ${
                              isSelected ? "text-white" : "text-gray-700"
                            }`}
                          >
                            {formatCents(slot.currentPriceCents)}
                          </span>
                        )}
                      </div>

                      {/* Spots + discount badge */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span
                          className={`text-xs ${
                            isSelected ? "text-white/70" : "text-gray-400"
                          }`}
                        >
                          {slot.spotsLeft}{" "}
                          {slot.spotsLeft === 1 ? "spot" : "spots"} left
                        </span>
                        {slot.hasDiscount && !isSelected && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                            {slot.discountPercent}% off
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* No slots */}
            {!slotsLoading && timeSlots.length === 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                <p className="text-sm font-medium text-gray-600">
                  No available times for this date.
                </p>
                <button
                  onClick={goBack}
                  className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Pick a different date
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/*  STEP 4: Details & Confirm                            */}
        {/* ══════════════════════════════════════════════════════ */}
        {step === "details" &&
          selectedService &&
          selectedDate &&
          selectedSlot && (
            <div className="space-y-6">
              {/* Booking summary card */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Booking Summary
                </h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Service</span>
                    <span className="font-medium text-gray-900">
                      {selectedService.name}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-3">
                    <span className="text-gray-500">Date</span>
                    <span className="font-medium text-gray-900">
                      {format(
                        new Date(selectedDate + "T00:00:00"),
                        "EEEE, MMMM d, yyyy"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-3">
                    <span className="text-gray-500">Time</span>
                    <span className="font-medium text-gray-900">
                      {format(new Date(selectedSlot.startTime), "h:mm a")}
                      {" – "}
                      {format(new Date(selectedSlot.endTime), "h:mm a")}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-3">
                    <span className="text-gray-500">Duration</span>
                    <span className="font-medium text-gray-900">
                      {selectedService.durationMinutes} min
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                    <span className="font-medium text-gray-900">Total</span>
                    <div className="flex items-center gap-2">
                      {selectedSlot.hasDiscount && (
                        <span className="text-sm text-gray-400 line-through">
                          {formatCents(selectedSlot.basePriceCents)}
                        </span>
                      )}
                      <span className="text-lg font-bold text-green-600">
                        {formatCents(selectedSlot.currentPriceCents)}
                      </span>
                      {selectedSlot.hasDiscount && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                          {selectedSlot.discountPercent}% off
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer form */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Your Details
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleBook();
                  }}
                  className="mt-4 space-y-4"
                >
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Full name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Jane Smith"
                      className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Phone{" "}
                      <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      backgroundColor: selectedService.color,
                    }}
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
                        Processing...
                      </span>
                    ) : selectedSlot.currentPriceCents > 0 ? (
                      `Pay ${formatCents(selectedSlot.currentPriceCents)} & Book`
                    ) : (
                      "Confirm Booking"
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
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
