"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { format, formatDistanceToNow, differenceInHours, addDays } from "date-fns";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/* ================================================================
   Type definitions
   ================================================================ */

interface Offer {
  id: string;
  ruleId: string;
  discountPercent: number;
  discountedPriceCents: number;
  disabledByUser: boolean;
  status: string;
  rule: { name: string };
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

interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
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

interface SlotForecast {
  slotId: string;
  predictedFillRate: number;
  confidence: number;
}

interface DemandInsight {
  type: "peak_hours" | "slow_days" | "trending_service" | "low_demand" | "opportunity";
  title: string;
  description: string;
  metric: string;
  trend: "up" | "down" | "stable";
}

interface CustomerRFMScore {
  id: string;
  name: string;
  email: string;
  segment: string;
  recencyScore: number;
  frequencyScore: number;
  monetaryScore: number;
  totalSpend: number;
}

interface SegmentSummary {
  segment: string;
  count: number;
  avgSpend: number;
  suggestedAction: string;
}

type HealthStatus = "HEALTHY" | "AT_RISK" | "LIKELY_EMPTY";

/* ================================================================
   Helper functions
   ================================================================ */

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

function formatCentsShort(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 10000) return `$${(dollars / 1000).toFixed(1)}k`;
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1)}k`;
  return `$${dollars.toFixed(0)}`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getSegmentColor(segment: string): {
  bg: string;
  text: string;
  ring: string;
  dot: string;
} {
  const s = segment.toLowerCase();
  if (s === "champions" || s === "champion")
    return {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      ring: "ring-emerald-600/20",
      dot: "bg-emerald-500",
    };
  if (s === "loyal" || s === "loyal_customers")
    return {
      bg: "bg-blue-50",
      text: "text-blue-700",
      ring: "ring-blue-600/20",
      dot: "bg-blue-500",
    };
  if (s === "at_risk" || s === "at risk")
    return {
      bg: "bg-amber-50",
      text: "text-amber-700",
      ring: "ring-amber-600/20",
      dot: "bg-amber-500",
    };
  if (s === "lost" || s === "hibernating")
    return {
      bg: "bg-rose-50",
      text: "text-rose-700",
      ring: "ring-rose-600/20",
      dot: "bg-rose-500",
    };
  if (s === "new" || s === "new_customers" || s === "recent")
    return {
      bg: "bg-violet-50",
      text: "text-violet-700",
      ring: "ring-violet-600/20",
      dot: "bg-violet-500",
    };
  if (s === "potential" || s === "promising")
    return {
      bg: "bg-cyan-50",
      text: "text-cyan-700",
      ring: "ring-cyan-600/20",
      dot: "bg-cyan-500",
    };
  return {
    bg: "bg-gray-50",
    text: "text-gray-700",
    ring: "ring-gray-600/20",
    dot: "bg-gray-400",
  };
}

/* ================================================================
   Animated Counter Hook
   ================================================================ */

function useAnimatedNumber(target: number, duration = 800): number {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const start = prev.current;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setDisplay(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prev.current = target;
      }
    }
    requestAnimationFrame(animate);
  }, [target, duration]);

  return display;
}

/* ================================================================
   Inline SVG Icons
   ================================================================ */

function DollarIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CalendarDaysIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
    </svg>
  );
}

function ChartBarIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function UsersIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function ClockIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function TrendingUpIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  );
}

function ArrowTrendingDownIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
    </svg>
  );
}

function SparklesIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function LinkIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  );
}

function TagIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
  );
}

function BoltIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

function ChevronRightIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

/* ================================================================
   Insight icon picker
   ================================================================ */

function InsightIcon({ type, className = "h-5 w-5" }: { type: string; className?: string }) {
  switch (type) {
    case "peak_hours":
      return <ClockIcon className={className} />;
    case "slow_days":
      return <CalendarDaysIcon className={className} />;
    case "trending_service":
      return <TrendingUpIcon className={className} />;
    case "low_demand":
      return <ArrowTrendingDownIcon className={className} />;
    case "opportunity":
      return <SparklesIcon className={className} />;
    default:
      return <BoltIcon className={className} />;
  }
}

/* ================================================================
   Skeleton components
   ================================================================ */

function SkeletonStatCard() {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-4">
          <div className="skeleton h-12 w-12 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-7 w-20" />
            <div className="skeleton h-3 w-28" />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function SkeletonInsightCard() {
  return (
    <div className="min-w-[280px] snap-start">
      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="skeleton h-9 w-9 rounded-xl" />
            <div className="skeleton h-4 w-32" />
          </div>
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-3/4" />
          <div className="flex items-center gap-2">
            <div className="skeleton h-6 w-16 rounded-full" />
            <div className="skeleton h-4 w-4 rounded-full" />
          </div>
        </CardBody>
      </Card>
    </div>
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

function SkeletonSegmentCard() {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="skeleton h-3 w-3 rounded-full" />
            <div className="skeleton h-4 w-24" />
          </div>
          <div className="skeleton h-6 w-10 rounded-full" />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-3 w-32" />
        </div>
      </CardBody>
    </Card>
  );
}

function SkeletonBookingRow() {
  return (
    <tr>
      <td className="px-6 py-4"><div className="skeleton h-4 w-28" /></td>
      <td className="px-6 py-4"><div className="skeleton h-4 w-24" /></td>
      <td className="px-6 py-4"><div className="skeleton h-4 w-20" /></td>
      <td className="px-6 py-4"><div className="skeleton h-4 w-16" /></td>
      <td className="px-6 py-4"><div className="skeleton h-4 w-20" /></td>
    </tr>
  );
}

/* ================================================================
   Toggle Switch
   ================================================================ */

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
      className={`toggle-switch ${enabled ? "bg-indigo-600" : "bg-gray-200"} ${
        loading ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      <span
        className={`toggle-switch-dot ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/* ================================================================
   Trend arrow component
   ================================================================ */

function TrendArrow({ trend, className = "" }: { trend: "up" | "down" | "stable"; className?: string }) {
  if (trend === "up")
    return (
      <span className={`inline-flex items-center text-emerald-600 ${className}`}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
        </svg>
      </span>
    );
  if (trend === "down")
    return (
      <span className={`inline-flex items-center text-rose-500 ${className}`}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
        </svg>
      </span>
    );
  return (
    <span className={`inline-flex items-center text-gray-400 ${className}`}>
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
      </svg>
    </span>
  );
}

/* ================================================================
   KPI Stat Card
   ================================================================ */

function KPIStatCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  subtext,
  trend,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: React.ReactNode;
  subtext?: React.ReactNode;
  trend?: "up" | "down" | "stable";
}) {
  return (
    <Card hover className="group">
      <CardBody>
        <div className="flex items-start justify-between">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg} ${iconColor} transition-transform duration-300 group-hover:scale-110`}>
            {icon}
          </div>
          {trend && <TrendArrow trend={trend} />}
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold tracking-tight text-gray-900">
            {value}
          </div>
          <p className="mt-0.5 text-sm font-medium text-gray-500">{label}</p>
          {subtext && (
            <p className="mt-1 text-xs text-gray-400">{subtext}</p>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

/* ================================================================
   Main Dashboard Page
   ================================================================ */

export default function DashboardPage() {
  // Data states
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [forecasts, setForecasts] = useState<SlotForecast[]>([]);
  const [insights, setInsights] = useState<DemandInsight[]>([]);
  const [, setRfmCustomers] = useState<CustomerRFMScore[]>([]);
  const [segments, setSegments] = useState<SegmentSummary[]>([]);
  const [slug, setSlug] = useState<string | null>(null);

  // Loading states (independent per section)
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [rfmLoading, setRfmLoading] = useState(true);
  const [slugLoading, setSlugLoading] = useState(true);

  // Interaction states
  const [togglingOffer, setTogglingOffer] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  /* ---------- Data fetching ---------- */

  const fetchSlots = useCallback(async () => {
    try {
      const res = await fetch("/api/slots?dashboard=true");
      if (!res.ok) return;
      const data = await res.json();
      setSlots(data);
    } catch {
      // silently fail — slots section will show empty state
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    async function loadAll() {
      const results = await Promise.allSettled([
        // 0 - slots
        fetch("/api/slots?dashboard=true").then((r) => r.ok ? r.json() : Promise.reject()),
        // 1 - forecast
        fetch("/api/analytics/forecast").then((r) => r.ok ? r.json() : Promise.reject()),
        // 2 - rfm
        fetch("/api/analytics/rfm").then((r) => r.ok ? r.json() : Promise.reject()),
        // 3 - bookings
        fetch("/api/bookings").then((r) => r.ok ? r.json() : Promise.reject()),
        // 4 - slug
        fetch("/api/business/slug").then((r) => r.ok ? r.json() : Promise.reject()),
      ]);

      // Slots
      if (results[0].status === "fulfilled") {
        setSlots(results[0].value);
      }
      setSlotsLoading(false);

      // Forecast
      if (results[1].status === "fulfilled") {
        const data = results[1].value;
        setForecasts(data.forecasts || []);
        setInsights(data.insights || []);
      }
      setForecastLoading(false);

      // RFM
      if (results[2].status === "fulfilled") {
        const data = results[2].value;
        setRfmCustomers(data.customers || []);
        setSegments(data.segments || []);
      }
      setRfmLoading(false);

      // Bookings
      if (results[3].status === "fulfilled") {
        setBookings(results[3].value || []);
      }
      setBookingsLoading(false);

      // Slug
      if (results[4].status === "fulfilled") {
        setSlug(results[4].value.slug || null);
      }
      setSlugLoading(false);
    }

    loadAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- Offer toggle ---------- */

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
      toast.success(offer.disabledByUser ? "Offer enabled" : "Offer disabled");
      await fetchSlots();
    } catch {
      toast.error("Failed to toggle offer");
    } finally {
      setTogglingOffer(null);
    }
  }

  /* ---------- Share link ---------- */

  function copyBookingLink() {
    if (!slug) return;
    const url = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      toast.success("Booking link copied to clipboard");
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  /* ---------- Computed data ---------- */

  const now = new Date();
  const sevenDaysLater = addDays(now, 7);
  const oneWeekAgo = addDays(now, -7);
  const twoWeeksAgo = addDays(now, -14);

  // Upcoming slots (next 7 days)
  const upcomingSlots = slots.filter((slot) => {
    const start = new Date(slot.startTime);
    return start >= now && start <= sevenDaysLater;
  });

  // Group slots by date
  const slotsByDate = upcomingSlots.reduce<Record<string, Slot[]>>((acc, slot) => {
    const dateKey = format(new Date(slot.startTime), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(slot);
    return acc;
  }, {});
  const sortedDates = Object.keys(slotsByDate).sort();

  // Forecast map for quick lookup
  const forecastMap = new Map(forecasts.map((f) => [f.slotId, f]));

  // KPI computations
  const thisWeekBookings = bookings.filter(
    (b) => new Date(b.createdAt) >= oneWeekAgo
  );
  const lastWeekBookings = bookings.filter(
    (b) => new Date(b.createdAt) >= twoWeeksAgo && new Date(b.createdAt) < oneWeekAgo
  );

  const totalRevenueCents = thisWeekBookings.reduce(
    (sum, b) => sum + b.pricePaidCents,
    0
  );
  const lastWeekRevenueCents = lastWeekBookings.reduce(
    (sum, b) => sum + b.pricePaidCents,
    0
  );
  const revenueTrend: "up" | "down" | "stable" =
    totalRevenueCents > lastWeekRevenueCents
      ? "up"
      : totalRevenueCents < lastWeekRevenueCents
      ? "down"
      : "stable";

  const activeBookingsCount = thisWeekBookings.length;

  const avgFillRate =
    upcomingSlots.length > 0
      ? Math.round(
          upcomingSlots.reduce(
            (sum, s) =>
              sum + (s.capacity > 0 ? (s.bookedCount / s.capacity) * 100 : 0),
            0
          ) / upcomingSlots.length
        )
      : 0;

  const uniqueCustomerCount = new Set(bookings.map((b) => b.customerEmail)).size;
  const championsCount = segments.find(
    (s) => s.segment.toLowerCase() === "champions" || s.segment.toLowerCase() === "champion"
  )?.count ?? 0;

  // Animated values
  const animatedRevenue = useAnimatedNumber(totalRevenueCents);
  const animatedBookings = useAnimatedNumber(activeBookingsCount);
  const animatedFillRate = useAnimatedNumber(avgFillRate);
  const animatedCustomers = useAnimatedNumber(uniqueCustomerCount);

  /* =================================================================
     RENDER
     ================================================================= */

  return (
    <div className="space-y-8 pb-12">
      {/* ====== 1. HEADER ====== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">{getGreeting()}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Your business performance at a glance.
          </p>
        </div>
        <div>
          {slugLoading ? (
            <div className="skeleton h-10 w-44 rounded-lg" />
          ) : slug ? (
            <Button
              variant="secondary"
              size="md"
              onClick={copyBookingLink}
              className="gap-2"
            >
              <LinkIcon className="h-4 w-4" />
              {linkCopied ? "Copied!" : "Share booking link"}
            </Button>
          ) : null}
        </div>
      </div>

      {/* ====== 2. KPI STAT CARDS ====== */}
      {bookingsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue */}
          <KPIStatCard
            icon={<DollarIcon />}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            label="Total Revenue"
            trend={revenueTrend}
            value={
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                {formatCents(animatedRevenue)}
              </span>
            }
            subtext={
              lastWeekRevenueCents > 0
                ? `${formatCentsShort(lastWeekRevenueCents)} last week`
                : "This week"
            }
          />

          {/* Active Bookings */}
          <KPIStatCard
            icon={<CalendarDaysIcon />}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            label="Active Bookings"
            trend={
              activeBookingsCount > lastWeekBookings.length
                ? "up"
                : activeBookingsCount < lastWeekBookings.length
                ? "down"
                : "stable"
            }
            value={animatedBookings}
            subtext="This week"
          />

          {/* Fill Rate */}
          <KPIStatCard
            icon={<ChartBarIcon />}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
            label="Fill Rate"
            value={
              <span className="bg-gradient-to-r from-violet-600 to-purple-500 bg-clip-text text-transparent">
                {animatedFillRate}%
              </span>
            }
            subtext={
              upcomingSlots.length > 0
                ? `Across ${upcomingSlots.length} upcoming slot${upcomingSlots.length !== 1 ? "s" : ""}`
                : "No upcoming slots"
            }
          />

          {/* Customer Segments */}
          <KPIStatCard
            icon={<UsersIcon />}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            label="Customer Segments"
            value={animatedCustomers}
            subtext={
              championsCount > 0 ? (
                <span>
                  <span className="font-semibold text-emerald-600">{championsCount}</span>{" "}
                  Champion{championsCount !== 1 ? "s" : ""}
                </span>
              ) : (
                "Unique customers"
              )
            }
          />
        </div>
      )}

      {/* ====== 3. DEMAND INSIGHTS ====== */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">
              Demand Insights
            </h2>
            <p className="text-sm text-gray-500">AI-powered trends and opportunities</p>
          </div>
        </div>

        {forecastLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            <SkeletonInsightCard />
            <SkeletonInsightCard />
            <SkeletonInsightCard />
            <SkeletonInsightCard />
          </div>
        ) : insights.length === 0 ? (
          <Card>
            <CardBody className="py-10">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                  <SparklesIcon />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">No insights yet</p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Insights will appear once you have more booking data.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="flex snap-x gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {insights.map((insight, idx) => {
              const iconBg =
                insight.trend === "up"
                  ? "bg-emerald-50 text-emerald-600"
                  : insight.trend === "down"
                  ? "bg-rose-50 text-rose-600"
                  : "bg-gray-100 text-gray-600";

              return (
                <div
                  key={idx}
                  className="min-w-[280px] max-w-[320px] snap-start"
                >
                  <Card hover className="h-full">
                    <CardBody className="flex h-full flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg} transition-transform duration-200`}
                          >
                            <InsightIcon type={insight.type} className="h-4.5 w-4.5" />
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900">
                            {insight.title}
                          </h3>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-gray-500">
                          {insight.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-800">
                          {insight.metric}
                        </span>
                        <TrendArrow trend={insight.trend} />
                      </div>
                    </CardBody>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ====== 4. TWO-COLUMN: SLOTS + SEGMENTS ====== */}
      <div className="grid gap-8 lg:grid-cols-5">
        {/* ---- Left: Upcoming Slots (60%) ---- */}
        <div className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">
              Upcoming Slots
            </h2>
            <a
              href="/app/slots"
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700"
            >
              View all <ChevronRightIcon />
            </a>
          </div>

          {slotsLoading ? (
            <div className="space-y-4">
              <SkeletonSlotCard />
              <SkeletonSlotCard />
              <SkeletonSlotCard />
            </div>
          ) : sortedDates.length === 0 ? (
            <Card>
              <CardBody className="py-16">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 text-gray-300">
                    <CalendarDaysIcon className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-gray-900">
                      No upcoming slots
                    </p>
                    <p className="text-sm text-gray-500">
                      Create some slots to start filling your schedule.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    className="mt-2"
                    onClick={() => (window.location.href = "/app/slots")}
                  >
                    Create a Slot
                  </Button>
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-8">
              {sortedDates.map((dateKey) => {
                const daySlots = slotsByDate[dateKey].sort(
                  (a, b) =>
                    new Date(a.startTime).getTime() -
                    new Date(b.startTime).getTime()
                );

                return (
                  <div key={dateKey} className="space-y-3">
                    {/* Date header */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <CalendarDaysIcon className="h-4 w-4" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {format(
                          new Date(dateKey + "T00:00:00"),
                          "EEEE, MMMM d"
                        )}
                      </h3>
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        {daySlots.length} slot{daySlots.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Slot cards */}
                    <div className="grid gap-3 sm:grid-cols-2">
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
                        const forecast = forecastMap.get(slot.id);

                        return (
                          <Card key={slot.id} hover>
                            <CardBody className="space-y-3">
                              {/* Top row */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h4 className="truncate text-sm font-semibold text-gray-900">
                                    {slot.serviceType}
                                  </h4>
                                  <p className="mt-0.5 text-xs text-gray-500">
                                    {format(startDate, "h:mm a")} &ndash;{" "}
                                    {format(endDate, "h:mm a")}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {forecast && (
                                    <Badge variant="info">
                                      {Math.round(forecast.predictedFillRate)}% predicted
                                    </Badge>
                                  )}
                                  <Badge variant={healthBadgeVariant(health)}>
                                    {healthLabel(health)}
                                  </Badge>
                                </div>
                              </div>

                              {/* Capacity bar */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-medium text-gray-500">
                                    Capacity
                                  </span>
                                  <span className="font-semibold text-gray-900">
                                    {slot.bookedCount} / {slot.capacity}
                                  </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                  <div
                                    className={`h-full rounded-full transition-all duration-700 ${
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
                                      <span className="text-xs text-gray-400 line-through">
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

                              {/* Offer section */}
                              {activeOffer ? (
                                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 space-y-2.5">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
                                        <TagIcon className="h-3.5 w-3.5" />
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
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                      {activeOffer.disabledByUser
                                        ? "Offer paused"
                                        : "Offer active"}
                                    </span>
                                    <ToggleSwitch
                                      enabled={!activeOffer.disabledByUser}
                                      loading={
                                        togglingOffer === activeOffer.id
                                      }
                                      onToggle={() =>
                                        toggleOffer(activeOffer)
                                      }
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-3 py-2.5">
                                  <TagIcon className="h-3.5 w-3.5 text-gray-300" />
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

        {/* ---- Right: Customer Segments (40%) ---- */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">
              Customer Segments
            </h2>
            <a
              href="/app/customers"
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700"
            >
              View all <ChevronRightIcon />
            </a>
          </div>

          {rfmLoading ? (
            <div className="space-y-3">
              <SkeletonSegmentCard />
              <SkeletonSegmentCard />
              <SkeletonSegmentCard />
              <SkeletonSegmentCard />
            </div>
          ) : segments.length === 0 ? (
            <Card>
              <CardBody className="py-16">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                    <UsersIcon />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      No segment data yet
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500">
                      Customer segments will appear once you have bookings.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-3">
              {segments.map((seg) => {
                const colors = getSegmentColor(seg.segment);
                return (
                  <Card key={seg.segment} hover>
                    <CardBody className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-3 w-3 rounded-full ${colors.dot}`}
                          />
                          <span className="text-sm font-semibold text-gray-900">
                            {seg.segment.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                          </span>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${colors.bg} ${colors.text} ${colors.ring}`}
                        >
                          {seg.count}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                          Avg spend:{" "}
                          <span className="font-semibold text-gray-700">
                            {formatCents(Math.round(seg.avgSpend))}
                          </span>
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-gray-500">
                        {seg.suggestedAction}
                      </p>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ====== 5. RECENT BOOKINGS ====== */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">
            Recent Bookings
          </h2>
          <a
            href="/app/bookings"
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700"
          >
            View all <ChevronRightIcon />
          </a>
        </div>

        {bookingsLoading ? (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Customer</th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Service</th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Price</th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Booked</th>
                  </tr>
                </thead>
                <tbody>
                  <SkeletonBookingRow />
                  <SkeletonBookingRow />
                  <SkeletonBookingRow />
                </tbody>
              </table>
            </div>
          </Card>
        ) : bookings.length === 0 ? (
          <Card>
            <CardBody className="py-12">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                  <CalendarDaysIcon />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    No bookings yet
                  </p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Bookings will show up here once customers start booking.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                      Service
                    </th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                      Date
                    </th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                      Price
                    </th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                      Booked
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bookings.slice(0, 5).map((booking) => (
                    <tr
                      key={booking.id}
                      className="transition-colors hover:bg-gray-50/50"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {booking.customerName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {booking.customerEmail}
                          </p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-gray-700">
                        {booking.slot.serviceType}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-gray-700">
                        {format(new Date(booking.slot.startTime), "MMM d, h:mm a")}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {formatCents(booking.pricePaidCents)}
                          </span>
                          {booking.discountPercent > 0 && (
                            <Badge variant="success">
                              {booking.discountPercent}% off
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-xs text-gray-500">
                        {formatDistanceToNow(new Date(booking.createdAt), {
                          addSuffix: true,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
