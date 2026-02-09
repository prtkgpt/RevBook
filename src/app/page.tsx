import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RevBook — Never Lose Money on Unsold Appointments Again",
  description:
    "RevBook predicts which slots won't fill and fixes it before it's too late. Smart dynamic pricing for salons, spas, studios, and service businesses. ~20% revenue uplift.",
};

/* ──────────────────────────── tiny SVG helpers ──────────────────────────── */

function LightningIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-5 h-5 text-indigo-600 shrink-0"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      className="w-5 h-5 text-gray-300 shrink-0"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/* ──────────────────────────── feature icons ─────────────────────────────── */

function DynamicPricingIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  );
}

function RulesIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v1m0 16v1m-8-9H3m18 0h-1M5.6 5.6l.7.7m12.4 12.4l-.7-.7M5.6 18.4l.7-.7m12.4-12.4l-.7.7" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function BookingPageIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  );
}

function ForecastIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 16l4-4 4 4 5-6" />
    </svg>
  );
}

function TargetingIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

/* ──────────────────────────── data ──────────────────────────────────────── */

const features = [
  {
    icon: <DynamicPricingIcon />,
    title: "Dynamic Pricing",
    description:
      "Prices adjust automatically based on fill rate, time-to-appointment, and demand signals.",
  },
  {
    icon: <RulesIcon />,
    title: "Smart Rules Engine",
    description:
      "Define conditions based on time-of-day, occupancy thresholds, day-of-week, and more.",
  },
  {
    icon: <BookingPageIcon />,
    title: "Public Booking Page",
    description:
      "A beautiful, branded page your customers can book from directly with real-time pricing.",
  },
  {
    icon: <ForecastIcon />,
    title: "Demand Forecasting",
    description:
      "AI predicts fill rates for upcoming slots and suggests optimal discount levels.",
  },
  {
    icon: <TargetingIcon />,
    title: "Customer Targeting",
    description:
      "RFM scoring segments your customers for personalized offers that drive repeat bookings.",
  },
  {
    icon: <MessageIcon />,
    title: "Email & SMS",
    description:
      "Send targeted offers via Resend email and Twilio SMS to the right customers at the right time.",
  },
];

const steps = [
  {
    number: "1",
    title: "Create Your Slots",
    description:
      "Add your appointment inventory with times, services, and base pricing.",
  },
  {
    number: "2",
    title: "Set Your Rules",
    description:
      "Define when and how discounts apply automatically with flexible conditions.",
  },
  {
    number: "3",
    title: "Watch Slots Fill",
    description:
      "Customers book through your branded page at dynamic, optimized prices.",
  },
];

const useCases = [
  { emoji: "✂️", type: "Salons", description: "Fill slow weekday chairs automatically" },
  { emoji: "🧖", type: "Spas & MedSpas", description: "Maximize treatment room utilization" },
  { emoji: "🏋️", type: "Fitness Studios", description: "Keep class attendance high every session" },
  { emoji: "📚", type: "Tutors", description: "Price open study slots to stay fully booked" },
  { emoji: "🧾", type: "Tax Accountants", description: "Manage seasonal demand surges" },
  { emoji: "💼", type: "Consultants", description: "Monetize last-minute calendar gaps" },
  { emoji: "🎪", type: "Event Venues", description: "Dynamic pricing for off-peak event slots" },
  { emoji: "🏥", type: "Healthcare", description: "Reduce no-show revenue loss" },
];

const freePlanFeatures = [
  "1 business",
  "50 slots per month",
  "3 discount rules",
  "Public booking page",
  "Email support",
];

const proPlanFeatures = [
  "Unlimited businesses",
  "Unlimited slots",
  "Unlimited rules",
  "Demand forecasting",
  "RFM customer targeting",
  "SMS via Twilio",
  "Priority support",
];

/* ──────────────────────────── page ──────────────────────────────────────── */

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: "#FAF9F6" }}>
      {/* ── Decorative blobs ── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-indigo-100/40 blur-3xl" />
        <div className="absolute top-1/3 -left-60 h-[500px] w-[500px] rounded-full bg-amber-100/30 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-indigo-50/50 blur-3xl" />
      </div>

      {/* ═══════════════════════ 1. STICKY NAV ═══════════════════════ */}
      <nav className="sticky top-0 z-50 border-b border-white/30 backdrop-blur-xl bg-[#FAF9F6]/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white transition-transform duration-300 group-hover:scale-105">
              <LightningIcon className="w-5 h-5" />
            </span>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              RevBook
            </span>
          </Link>

          {/* Center links (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-8">
            {[
              ["How It Works", "#how-it-works"],
              ["Features", "#features"],
              ["Pricing", "#pricing"],
              ["Blog", "/blog"],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="text-sm font-medium text-gray-600 transition-colors duration-200 hover:text-indigo-600"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/signin"
              className="hidden sm:inline-flex text-sm font-medium text-gray-600 transition-colors duration-200 hover:text-indigo-600"
            >
              Login
            </Link>
            <Link
              href="/signin"
              className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-indigo-700 hover:shadow-md active:scale-[0.97]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════ 2. HERO ═══════════════════════════ */}
      <section className="relative px-6 pt-20 pb-24 md:pt-32 md:pb-36">
        {/* Floating decorative pills */}
        <div className="pointer-events-none absolute top-16 left-[8%] h-3 w-12 rounded-full bg-indigo-300/40 rotate-12" />
        <div className="pointer-events-none absolute top-32 right-[12%] h-3 w-8 rounded-full bg-indigo-400/30 -rotate-6" />
        <div className="pointer-events-none absolute bottom-28 left-[15%] h-2.5 w-10 rounded-full bg-amber-300/40 rotate-3" />
        <div className="pointer-events-none absolute top-48 left-[60%] h-2 w-2 rounded-full bg-indigo-400/50" />
        <div className="pointer-events-none absolute bottom-40 right-[20%] h-3 w-3 rounded-full bg-indigo-300/40" />

        <div className="mx-auto max-w-7xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Now in public beta
          </div>

          <h1 className="mx-auto max-w-4xl font-serif text-5xl font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            Never Lose Money on
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Unsold Appointments
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-500 sm:text-xl">
            We predict which slots won&rsquo;t fill and fix it before it&rsquo;s too late.
            Smart dynamic pricing that turns empty time into revenue &mdash; automatically.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signin"
              className="inline-flex items-center rounded-xl bg-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/30 active:scale-[0.97]"
            >
              Get Started Free
              <svg className="ml-2 w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center rounded-xl border-2 border-gray-300 px-7 py-3.5 text-base font-semibold text-gray-700 transition-all duration-200 hover:border-indigo-300 hover:text-indigo-600 active:scale-[0.97]"
            >
              See How It Works
            </Link>
          </div>

          {/* Hero mockup */}
          <div className="mx-auto mt-16 max-w-3xl">
            <div className="rounded-2xl border border-gray-200/80 bg-white/80 p-6 shadow-2xl shadow-gray-200/60 backdrop-blur-sm sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                    Your Booking Page
                  </div>
                  <div className="text-lg font-semibold text-gray-800 mt-1">
                    Tuesday, February 10
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </div>
              </div>

              <div className="space-y-3">
                {/* Slot card 1 — booked up */}
                <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-semibold text-gray-800 w-16">
                      10:00am
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">Haircut</div>
                      <div className="text-xs text-gray-400">4/4 booked</div>
                    </div>
                  </div>
                  <div className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-500">
                    Full
                  </div>
                </div>

                {/* Slot card 2 — discounted & filling */}
                <div className="flex items-center justify-between rounded-xl border-2 border-indigo-200 bg-indigo-50/40 p-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-bl-lg">
                    20% OFF
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-semibold text-gray-800 w-16">
                      2:00pm
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">Haircut</div>
                      <div className="text-xs text-gray-400">3/4 booked</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400 line-through">$60</div>
                    <div className="text-sm font-bold text-indigo-600">$48</div>
                  </div>
                </div>

                {/* Slot card 3 — big discount */}
                <div className="flex items-center justify-between rounded-xl border-2 border-amber-200 bg-amber-50/40 p-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-bl-lg">
                    30% OFF
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-semibold text-gray-800 w-16">
                      4:00pm
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">Color Treatment</div>
                      <div className="text-xs text-gray-400">1/4 booked</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400 line-through">$120</div>
                    <div className="text-sm font-bold text-amber-600">$84</div>
                  </div>
                </div>

                {/* Slot card 4 */}
                <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-semibold text-gray-800 w-16">
                      5:30pm
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">Beard Trim</div>
                      <div className="text-xs text-gray-400">2/2 booked</div>
                    </div>
                  </div>
                  <div className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-500">
                    Full
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ 3. METRICS / TRUST BAR ═══════════════ */}
      <section className="border-y border-gray-200/60 bg-white/50 backdrop-blur-sm py-16 px-6">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3 text-center">
          {[
            { number: "~20%", label: "Revenue uplift from time that would have gone unsold" },
            { number: "2 weeks", label: "To see measurable results" },
            { number: "$0", label: "Setup cost. We handle the technical work." },
          ].map(({ number, label }) => (
            <div key={number}>
              <div className="font-serif text-5xl font-bold tracking-tight text-indigo-600 lg:text-6xl">
                {number}
              </div>
              <div className="mt-2 text-sm font-medium text-gray-500">
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════ 4. PROBLEM -> SOLUTION ═══════════════ */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            {/* Problem */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-600 mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                The Problem
              </div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Every empty slot is money left on the table
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-500">
                Service businesses lose thousands in unrealized revenue every
                month from unfilled appointment slots. That time would have
                otherwise generated zero income. Manual discounting is
                time-consuming, inconsistent, and impossible to optimize.
              </p>

              {/* Revenue lost examples */}
              <div className="mt-8 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-2">
                  Revenue lost today
                </div>
                {[
                  { service: "4 empty haircuts", price: "$60", total: "$240" },
                  { service: "2 empty facials", price: "$120", total: "$240" },
                  { service: "1 empty massage", price: "$150", total: "$150" },
                ].map((item) => (
                  <div key={item.service} className="flex items-center justify-between rounded-lg border border-red-200/60 bg-red-50/30 px-4 py-3">
                    <span className="text-sm text-gray-600">{item.service} &times; {item.price}</span>
                    <span className="text-sm font-bold text-red-600">&minus;{item.total}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-lg bg-red-100/60 px-4 py-3">
                  <span className="text-sm font-semibold text-red-700">Total lost today</span>
                  <span className="text-lg font-bold text-red-700">&minus;$630</span>
                </div>
              </div>
            </div>

            {/* Solution */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                The Solution
              </div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                We predict &amp; fix it before it&rsquo;s too late
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-500">
                RevBook uses AI to predict which time slots won&rsquo;t fill based on
                historical utilization and demand. Then it automatically creates
                the right discount to fill them &mdash; rescuing revenue you would
                have lost.
              </p>

              {/* Revenue rescued examples */}
              <div className="mt-8 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
                  Revenue rescued by RevBook
                </div>
                {[
                  { service: "3 haircuts rescued", discount: "20% off", price: "$48 ea", total: "$144" },
                  { service: "2 facials rescued", discount: "15% off", price: "$102 ea", total: "$204" },
                  { service: "1 massage rescued", discount: "25% off", price: "$112", total: "$112" },
                ].map((item) => (
                  <div key={item.service} className="flex items-center justify-between rounded-lg border border-emerald-200/60 bg-emerald-50/30 px-4 py-3">
                    <div>
                      <span className="text-sm text-gray-600">{item.service}</span>
                      <span className="ml-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{item.discount}</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">+{item.total}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-lg bg-emerald-100/60 px-4 py-3">
                  <span className="text-sm font-semibold text-emerald-700">Total rescued today</span>
                  <span className="text-lg font-bold text-emerald-700">+$460</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ 5. FEATURES GRID ═══════════════════ */}
      <section id="features" className="px-6 py-24 md:py-32 bg-white/40">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-4">
              Features
            </div>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to fill every slot
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              A complete toolkit for automated appointment optimization and revenue recovery.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-gray-200/80 bg-white/70 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-indigo-200/60"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors duration-300 group-hover:bg-indigo-600 group-hover:text-white">
                  {feature.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ 6. HOW IT WORKS ═══════════════════ */}
      <section id="how-it-works" className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-4">
              How It Works
            </div>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Three steps to full appointments
            </h2>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-6 top-12 bottom-12 hidden w-px bg-gradient-to-b from-indigo-300 via-indigo-200 to-indigo-100 md:left-1/2 md:block" />

            <div className="space-y-12 md:space-y-16">
              {steps.map((step, i) => (
                <div
                  key={step.number}
                  className={`relative flex flex-col items-center gap-6 md:flex-row ${
                    i % 2 === 1 ? "md:flex-row-reverse" : ""
                  }`}
                >
                  {/* Number circle */}
                  <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-500/30 md:absolute md:left-1/2 md:-translate-x-1/2">
                    {step.number}
                  </div>

                  {/* Content card */}
                  <div
                    className={`w-full rounded-2xl border border-gray-200/80 bg-white/70 p-6 backdrop-blur-sm md:w-5/12 ${
                      i % 2 === 0 ? "md:mr-auto md:pr-8" : "md:ml-auto md:pl-8"
                    }`}
                  >
                    <h3 className="text-xl font-semibold text-gray-900">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-500">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ 7. USE CASES ═══════════════════════ */}
      <section className="px-6 py-24 md:py-32 bg-white/40">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-4">
              Use Cases
            </div>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Built for service businesses everywhere
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {useCases.map((uc) => (
              <div
                key={uc.type}
                className="group rounded-xl border border-gray-200/80 bg-white/70 p-5 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-indigo-200/60"
              >
                <div className="text-3xl mb-3">{uc.emoji}</div>
                <div className="text-sm font-semibold text-gray-900">{uc.type}</div>
                <div className="mt-1 text-xs text-gray-500 leading-relaxed">
                  {uc.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ 7.5 REAL REVENUE EXAMPLES ═════════ */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-4">
              Real Results
            </div>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Revenue rescued, every single day
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Here&rsquo;s how RevBook turns empty slots into real money across different industries.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                business: "Spin Studio",
                icon: "🚴",
                slots: "12 redirected riders",
                price: "$27 per class",
                total: "$324",
                color: "indigo",
              },
              {
                business: "MedSpa",
                icon: "🧖",
                slots: "6 treatments rescued",
                price: "$157 avg treatment",
                total: "$942",
                color: "violet",
              },
              {
                business: "Tax Accountant",
                icon: "🧾",
                slots: "4 client sessions",
                price: "$160 per session",
                total: "$640",
                color: "amber",
              },
            ].map((example) => (
              <div
                key={example.business}
                className="group rounded-2xl border border-gray-200/80 bg-white/70 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="text-3xl mb-3">{example.icon}</div>
                <div className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                  {example.business}
                </div>
                <div className="mt-4 space-y-2">
                  <div className="text-sm text-gray-600">{example.slots}</div>
                  <div className="text-sm text-gray-500">{example.price}</div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Revenue rescued</div>
                  <div className="text-2xl font-serif font-bold text-emerald-600 mt-1">
                    +{example.total}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">per day</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ 8. PRICING ═════════════════════════ */}
      <section id="pricing" className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-4">
              Pricing
            </div>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Start free. Upgrade when you&rsquo;re ready.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 max-w-3xl mx-auto items-start">
            {/* Free plan */}
            <div className="rounded-2xl border border-gray-200/80 bg-white/70 p-8 backdrop-blur-sm">
              <div className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Free
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-serif text-5xl font-bold tracking-tight text-gray-900">
                  $0
                </span>
                <span className="text-sm text-gray-400">/month</span>
              </div>
              <p className="mt-3 text-sm text-gray-500">
                Perfect for getting started and testing the waters.
              </p>

              <ul className="mt-8 space-y-3">
                {freePlanFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-600">
                    <CheckIcon />
                    {f}
                  </li>
                ))}
                {["Demand forecasting", "SMS messaging"].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-400">
                    <XIcon />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/signin"
                className="mt-8 block w-full rounded-xl border-2 border-gray-300 py-3 text-center text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-indigo-300 hover:text-indigo-600 active:scale-[0.98]"
              >
                Get Started
              </Link>
            </div>

            {/* Pro plan */}
            <div className="relative rounded-2xl border-2 border-indigo-600 bg-white p-8 shadow-xl shadow-indigo-100/50 md:-mt-4 md:mb-4">
              {/* Badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-bold text-white shadow-lg shadow-indigo-500/30">
                Most popular
              </div>

              <div className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
                Pro
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-serif text-5xl font-bold tracking-tight text-gray-900">
                  $29
                </span>
                <span className="text-sm text-gray-400">/month</span>
              </div>
              <p className="mt-3 text-sm text-gray-500">
                For growing businesses that want every advantage.
              </p>

              <ul className="mt-8 space-y-3">
                {proPlanFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-600">
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/signin"
                className="mt-8 block w-full rounded-xl bg-indigo-600 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:bg-indigo-700 hover:shadow-xl active:scale-[0.98]"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ 9. CTA SECTION ════════════════════ */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-3xl rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 p-12 text-center shadow-2xl shadow-indigo-500/20 sm:p-16 relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5 blur-xl" />

          <h2 className="relative font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Start selling time that would&rsquo;ve gone unsold
          </h2>
          <p className="relative mt-4 text-lg text-indigo-200">
            Most businesses see measurable results within the first 2 weeks.
            Early customers report up to 15&ndash;25% revenue uplift.
          </p>
          <Link
            href="/signin"
            className="relative mt-8 inline-flex items-center rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-indigo-700 shadow-lg transition-all duration-200 hover:bg-indigo-50 hover:shadow-xl active:scale-[0.97]"
          >
            Get Started Free
            <svg className="ml-2 w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ═══════════════════════ 10. FOOTER ═════════════════════════ */}
      <footer className="border-t border-gray-200/60 bg-white/30 backdrop-blur-sm px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div>
              <Link href="/" className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <LightningIcon className="w-4 h-4" />
                </span>
                <span className="text-lg font-bold tracking-tight text-gray-900">
                  RevBook
                </span>
              </Link>
              <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                Automated appointment slot optimization with smart, dynamic
                pricing.
              </p>
            </div>

            {/* Product */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Product
              </div>
              <ul className="mt-4 space-y-3">
                {[
                  ["Features", "#features"],
                  ["Pricing", "#pricing"],
                  ["Blog", "/blog"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-gray-600 transition-colors duration-200 hover:text-indigo-600"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Company
              </div>
              <ul className="mt-4 space-y-3">
                {[
                  ["About", "#"],
                  ["Contact", "#"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-gray-600 transition-colors duration-200 hover:text-indigo-600"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Legal
              </div>
              <ul className="mt-4 space-y-3">
                {[
                  ["Privacy", "#"],
                  ["Terms", "#"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-gray-600 transition-colors duration-200 hover:text-indigo-600"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-gray-200/60 pt-8 text-center text-sm text-gray-400">
            &copy; 2026 RevBook. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
