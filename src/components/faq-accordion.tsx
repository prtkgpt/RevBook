"use client";

import { useState } from "react";

const faqs = [
  {
    question: "How does RevBook actually work?",
    answer:
      "RevBook connects to your appointment calendar and monitors fill rates in real time. When it detects slots that are likely to go unfilled, it automatically applies your pre-set discount rules and notifies targeted customers via email or SMS. Customers book directly through your branded booking page at the discounted price.",
  },
  {
    question: "How quickly will I see results?",
    answer:
      "Most businesses see measurable results within the first 2 weeks. Once your discount rules are configured and your customer list is imported, RevBook starts working immediately — predicting demand patterns and filling gaps in your schedule.",
  },
  {
    question: "Will my customers be confused by different prices?",
    answer:
      "Not at all. Discounted slots are presented as limited-time deals or last-minute offers, similar to how airlines and hotels adjust pricing. Customers love getting a deal, and your regulars who book in advance still pay full price.",
  },
  {
    question: "How does integration work?",
    answer:
      "RevBook works as a standalone booking layer — no complex integrations required. Simply create your slot inventory (manually or via CSV import), set your rules, and share your booking page link. We also support Stripe for seamless payment processing.",
  },
  {
    question: "How do I get started?",
    answer:
      "Sign up for a free account, create your business profile, add your appointment slots, and configure at least one discount rule. Your public booking page goes live instantly. Upgrade to Pro anytime for advanced features like demand forecasting and SMS messaging.",
  },
  {
    question: "What if my business sells memberships or class packs instead of appointments?",
    answer:
      "RevBook works great for class-based businesses too. Each class session is treated as a slot with a capacity. When a class isn't filling up, RevBook can offer discounted drop-in rates to fill those empty spots — turning unused capacity into revenue.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className="rounded-xl border border-gray-200/80 bg-white/70 backdrop-blur-sm overflow-hidden transition-all duration-200"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between px-6 py-5 text-left"
            >
              <span className="text-sm font-semibold text-gray-900 pr-4">
                {faq.question}
              </span>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </button>
            <div
              className={`grid transition-all duration-200 ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-5 text-sm leading-relaxed text-gray-500">
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
