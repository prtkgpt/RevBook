import { prisma } from "@/lib/prisma";

// ── Types ────────────────────────────────────────────────────

export type CustomerSegment =
  | "champions"
  | "loyal"
  | "potential_loyal"
  | "new_customers"
  | "at_risk"
  | "needs_attention"
  | "lost";

export interface CustomerRFMScore {
  customerId: string;
  customerName: string;
  customerEmail: string;
  recencyScore: number; // 1-5 (5 = most recent)
  frequencyScore: number; // 1-5 (5 = most frequent)
  monetaryScore: number; // 1-5 (5 = highest spend)
  totalScore: number; // sum of R+F+M
  segment: CustomerSegment;
  lastBookingDate: Date | null;
  totalBookings: number;
  totalSpentCents: number;
  avgSpentCents: number;
}

export interface SegmentSummary {
  segment: CustomerSegment;
  label: string;
  description: string;
  count: number;
  avgTotalSpentCents: number;
  suggestedAction: string;
  color: string; // Tailwind color name
}

// ── Segment metadata ─────────────────────────────────────────

const SEGMENT_META: Record<
  CustomerSegment,
  { label: string; description: string; suggestedAction: string; color: string }
> = {
  champions: {
    label: "Champions",
    description:
      "Best customers with recent, frequent, high-value bookings",
    suggestedAction: "Send exclusive early access offers",
    color: "emerald",
  },
  loyal: {
    label: "Loyal Customers",
    description:
      "Consistent bookers with strong frequency and spending",
    suggestedAction: "Reward with loyalty discounts",
    color: "blue",
  },
  potential_loyal: {
    label: "Potential Loyalists",
    description:
      "Recent customers with moderate frequency — close to becoming loyal",
    suggestedAction: "Offer membership or bundle deals",
    color: "violet",
  },
  new_customers: {
    label: "New Customers",
    description:
      "Very recent first-time or near-first-time bookers",
    suggestedAction: "Send welcome series, first-time discount",
    color: "sky",
  },
  at_risk: {
    label: "At Risk",
    description:
      "Previously good customers who haven't booked recently",
    suggestedAction: "Send win-back campaign with 20% discount",
    color: "amber",
  },
  needs_attention: {
    label: "Needs Attention",
    description:
      "Low engagement across recency and frequency",
    suggestedAction: "Send re-engagement email",
    color: "orange",
  },
  lost: {
    label: "Lost",
    description:
      "Haven't booked in a long time with minimal engagement",
    suggestedAction: "Aggressive win-back with 30%+ discount",
    color: "rose",
  },
};

// ── Helpers ──────────────────────────────────────────────────

/**
 * Assign quintile scores (1-5) to an array of numeric values.
 * Higher value = higher score for ascending metrics (frequency, monetary).
 * For recency (days since last booking), lower value = higher score (inverted).
 */
function assignQuintiles(
  values: number[],
  invert: boolean = false
): Map<number, number> {
  if (values.length === 0) return new Map();

  // Create indexed pairs and sort
  const indexed = values.map((v, i) => ({ value: v, index: i }));
  indexed.sort((a, b) => a.value - b.value);

  const scoreMap = new Map<number, number>();
  const n = indexed.length;

  for (let i = 0; i < n; i++) {
    // Percentile rank (0-based)
    const percentile = n === 1 ? 0.5 : i / (n - 1);
    let score: number;

    if (percentile < 0.2) score = 1;
    else if (percentile < 0.4) score = 2;
    else if (percentile < 0.6) score = 3;
    else if (percentile < 0.8) score = 4;
    else score = 5;

    // Invert for recency: fewer days ago = higher score
    if (invert) score = 6 - score;

    scoreMap.set(indexed[i].index, score);
  }

  return scoreMap;
}

function assignSegment(r: number, f: number, m: number): CustomerSegment {
  // Champions: R>=4, F>=4, M>=4
  if (r >= 4 && f >= 4 && m >= 4) return "champions";

  // Loyal: F>=4, M>=3
  if (f >= 4 && m >= 3) return "loyal";

  // Potential Loyal: R>=4, F=2-3
  if (r >= 4 && f >= 2 && f <= 3) return "potential_loyal";

  // New Customers: R>=4, F=1
  if (r >= 4 && f === 1) return "new_customers";

  // At Risk: R=2-3, F>=3
  if (r >= 2 && r <= 3 && f >= 3) return "at_risk";

  // Needs Attention: R=2-3, F=1-2
  if (r >= 2 && r <= 3 && f >= 1 && f <= 2) return "needs_attention";

  // Lost: R=1
  if (r === 1) return "lost";

  // Fallback: needs_attention
  return "needs_attention";
}

// ── Core: scoreCustomers ─────────────────────────────────────

export async function scoreCustomers(
  businessId: string
): Promise<CustomerRFMScore[]> {
  const now = new Date();

  // 1. Fetch all bookings for the business
  const bookings = await prisma.booking.findMany({
    where: { businessId },
    select: {
      customerEmail: true,
      customerName: true,
      pricePaidCents: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (bookings.length === 0) return [];

  // 2. Aggregate per customer email
  const customerMap = new Map<
    string,
    {
      name: string;
      email: string;
      lastBooking: Date;
      totalBookings: number;
      totalSpentCents: number;
    }
  >();

  for (const b of bookings) {
    const existing = customerMap.get(b.customerEmail);
    if (existing) {
      existing.totalBookings += 1;
      existing.totalSpentCents += b.pricePaidCents;
      if (b.createdAt > existing.lastBooking) {
        existing.lastBooking = b.createdAt;
        existing.name = b.customerName; // Use most recent name
      }
    } else {
      customerMap.set(b.customerEmail, {
        name: b.customerName,
        email: b.customerEmail,
        lastBooking: b.createdAt,
        totalBookings: 1,
        totalSpentCents: b.pricePaidCents,
      });
    }
  }

  const customers = Array.from(customerMap.values());

  // 3. Calculate raw RFM values
  const recencyDays = customers.map((c) =>
    Math.max(
      0,
      Math.floor(
        (now.getTime() - c.lastBooking.getTime()) / (1000 * 60 * 60 * 24)
      )
    )
  );
  const frequencies = customers.map((c) => c.totalBookings);
  const monetaryValues = customers.map((c) => c.totalSpentCents);

  // 4. Assign quintile scores
  const rScores = assignQuintiles(recencyDays, true); // invert: fewer days = higher score
  const fScores = assignQuintiles(frequencies, false);
  const mScores = assignQuintiles(monetaryValues, false);

  // 5. Try to match with existing Customer records for IDs
  const customerEmails = customers.map((c) => c.email);
  const dbCustomers = await prisma.customer.findMany({
    where: {
      businessId,
      email: { in: customerEmails },
    },
    select: { id: true, email: true },
  });
  const emailToId = new Map(
    dbCustomers.map((c) => [c.email, c.id])
  );

  // 6. Build scored results
  const results: CustomerRFMScore[] = customers.map((customer, i) => {
    const r = rScores.get(i) ?? 3;
    const f = fScores.get(i) ?? 3;
    const m = mScores.get(i) ?? 3;

    return {
      customerId: emailToId.get(customer.email) ?? `email:${customer.email}`,
      customerName: customer.name,
      customerEmail: customer.email,
      recencyScore: r,
      frequencyScore: f,
      monetaryScore: m,
      totalScore: r + f + m,
      segment: assignSegment(r, f, m),
      lastBookingDate: customer.lastBooking,
      totalBookings: customer.totalBookings,
      totalSpentCents: customer.totalSpentCents,
      avgSpentCents:
        customer.totalBookings > 0
          ? Math.round(customer.totalSpentCents / customer.totalBookings)
          : 0,
    };
  });

  // Sort by total score descending (best customers first)
  results.sort((a, b) => b.totalScore - a.totalScore);

  return results;
}

// ── Core: getSegmentSummaries ────────────────────────────────

export async function getSegmentSummaries(
  businessId: string
): Promise<SegmentSummary[]> {
  const scored = await scoreCustomers(businessId);

  // Group by segment
  const segmentGroups = new Map<
    CustomerSegment,
    { count: number; totalSpent: number }
  >();

  for (const customer of scored) {
    const existing = segmentGroups.get(customer.segment) || {
      count: 0,
      totalSpent: 0,
    };
    existing.count += 1;
    existing.totalSpent += customer.totalSpentCents;
    segmentGroups.set(customer.segment, existing);
  }

  // Build summaries for all segments (including those with 0 customers)
  const allSegments: CustomerSegment[] = [
    "champions",
    "loyal",
    "potential_loyal",
    "new_customers",
    "at_risk",
    "needs_attention",
    "lost",
  ];

  const summaries: SegmentSummary[] = allSegments.map((segment) => {
    const group = segmentGroups.get(segment) || {
      count: 0,
      totalSpent: 0,
    };
    const meta = SEGMENT_META[segment];

    return {
      segment,
      label: meta.label,
      description: meta.description,
      count: group.count,
      avgTotalSpentCents:
        group.count > 0
          ? Math.round(group.totalSpent / group.count)
          : 0,
      suggestedAction: meta.suggestedAction,
      color: meta.color,
    };
  });

  return summaries;
}
