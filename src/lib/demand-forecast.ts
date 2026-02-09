import { prisma } from "@/lib/prisma";

// ── Types ────────────────────────────────────────────────────

export interface SlotForecast {
  slotId: string;
  serviceType: string;
  startTime: Date;
  predictedFillRate: number; // 0-100 percentage
  confidence: "high" | "medium" | "low";
  suggestedDiscountPercent: number; // 0 if no discount needed
  demandLevel: "high" | "moderate" | "low";
  reasoning: string; // Human-readable explanation
}

export interface DemandInsight {
  type:
    | "peak_hours"
    | "slow_days"
    | "trending_service"
    | "declining_service"
    | "optimal_pricing";
  title: string;
  description: string;
  metric: string;
  trend: "up" | "down" | "stable";
}

// ── Helpers ──────────────────────────────────────────────────

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function hourLabel(hour: number): string {
  if (hour === 0) return "12am";
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return "12pm";
  return `${hour - 12}pm`;
}

function bucketKey(dayOfWeek: number, hour: number, serviceType: string) {
  return `${dayOfWeek}-${hour}-${serviceType}`;
}

function demandLevelFromFill(fill: number): "high" | "moderate" | "low" {
  if (fill >= 70) return "high";
  if (fill >= 40) return "moderate";
  return "low";
}

function confidenceFromSamples(
  count: number
): "high" | "medium" | "low" {
  if (count >= 8) return "high";
  if (count >= 3) return "medium";
  return "low";
}

// ── Core: forecastSlots ──────────────────────────────────────

export async function forecastSlots(
  businessId: string
): Promise<SlotForecast[]> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysFromNow = new Date(
    now.getTime() + 7 * 24 * 60 * 60 * 1000
  );
  const fortyEightHoursFromNow = new Date(
    now.getTime() + 48 * 60 * 60 * 1000
  );

  // 1. Fetch historical slots from the last 30 days
  const historicalSlots = await prisma.slot.findMany({
    where: {
      businessId,
      startTime: { gte: thirtyDaysAgo, lte: now },
    },
    select: {
      id: true,
      serviceType: true,
      startTime: true,
      capacity: true,
      bookedCount: true,
    },
  });

  // 2. Build fill-rate buckets: (dayOfWeek, hour, serviceType) -> fill rates
  const buckets = new Map<string, number[]>();
  const overallFillRates: number[] = [];

  for (const slot of historicalSlots) {
    const fillRate =
      slot.capacity > 0
        ? Math.round((slot.bookedCount / slot.capacity) * 100)
        : 0;
    const dayOfWeek = slot.startTime.getDay();
    const hour = slot.startTime.getHours();
    const key = bucketKey(dayOfWeek, hour, slot.serviceType);

    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(fillRate);
    overallFillRates.push(fillRate);
  }

  // Fallback average across all historical data
  const overallAvg =
    overallFillRates.length > 0
      ? overallFillRates.reduce((a, b) => a + b, 0) / overallFillRates.length
      : 50; // neutral fallback if no data at all

  // 3. Fetch upcoming slots (next 7 days)
  const upcomingSlots = await prisma.slot.findMany({
    where: {
      businessId,
      startTime: { gte: now, lte: sevenDaysFromNow },
      status: "OPEN",
    },
    select: {
      id: true,
      serviceType: true,
      startTime: true,
      capacity: true,
      bookedCount: true,
    },
    orderBy: { startTime: "asc" },
  });

  // 4. Generate forecasts
  const forecasts: SlotForecast[] = upcomingSlots.map((slot) => {
    const dayOfWeek = slot.startTime.getDay();
    const hour = slot.startTime.getHours();
    const key = bucketKey(dayOfWeek, hour, slot.serviceType);
    const historicalRates = buckets.get(key);

    let predictedFillRate: number;
    let confidence: "high" | "medium" | "low";
    const reasoningParts: string[] = [];

    if (historicalRates && historicalRates.length > 0) {
      predictedFillRate = Math.round(
        historicalRates.reduce((a, b) => a + b, 0) / historicalRates.length
      );
      confidence = confidenceFromSamples(historicalRates.length);
      reasoningParts.push(
        `${DAY_NAMES[dayOfWeek]} ${hourLabel(hour)} ${slot.serviceType} typically fills ${predictedFillRate}% (based on ${historicalRates.length} past slots)`
      );
    } else {
      predictedFillRate = Math.round(overallAvg);
      confidence = "low";
      reasoningParts.push(
        `No specific history for ${DAY_NAMES[dayOfWeek]} ${hourLabel(hour)} ${slot.serviceType} — using overall average of ${predictedFillRate}%`
      );
    }

    // Factor in current bookings if slot already has some
    const currentFill =
      slot.capacity > 0
        ? Math.round((slot.bookedCount / slot.capacity) * 100)
        : 0;
    if (currentFill > 0) {
      // Blend current fill with prediction, weighted toward current
      predictedFillRate = Math.round(currentFill * 0.6 + predictedFillRate * 0.4);
      reasoningParts.push(`already ${currentFill}% booked`);
    }

    // Cap at 0-100
    predictedFillRate = Math.max(0, Math.min(100, predictedFillRate));

    // 6. Suggest discount if under-filling and within 48 hours
    let suggestedDiscountPercent = 0;
    const isWithin48Hours = slot.startTime <= fortyEightHoursFromNow;

    if (predictedFillRate < 50 && isWithin48Hours) {
      suggestedDiscountPercent = Math.min(50 - predictedFillRate, 40);
      reasoningParts.push(
        `suggest ${suggestedDiscountPercent}% discount (within 48h, low predicted fill)`
      );
    }

    const demandLevel = demandLevelFromFill(predictedFillRate);
    const reasoning = reasoningParts.join(" — ");

    return {
      slotId: slot.id,
      serviceType: slot.serviceType,
      startTime: slot.startTime,
      predictedFillRate,
      confidence,
      suggestedDiscountPercent,
      demandLevel,
      reasoning,
    };
  });

  return forecasts;
}

// ── Core: getDemandInsights ──────────────────────────────────

export async function getDemandInsights(
  businessId: string
): Promise<DemandInsight[]> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const historicalSlots = await prisma.slot.findMany({
    where: {
      businessId,
      startTime: { gte: thirtyDaysAgo, lte: now },
    },
    select: {
      serviceType: true,
      startTime: true,
      capacity: true,
      bookedCount: true,
    },
  });

  if (historicalSlots.length === 0) {
    return [];
  }

  const insights: DemandInsight[] = [];

  // ── Peak hours ─────────────────────────────────────────────

  const hourBuckets = new Map<number, { total: number; count: number }>();
  for (const slot of historicalSlots) {
    const hour = slot.startTime.getHours();
    const fill =
      slot.capacity > 0 ? (slot.bookedCount / slot.capacity) * 100 : 0;
    const entry = hourBuckets.get(hour) || { total: 0, count: 0 };
    entry.total += fill;
    entry.count += 1;
    hourBuckets.set(hour, entry);
  }

  const hourAvgs = Array.from(hourBuckets.entries())
    .map(([hour, { total, count }]) => ({
      hour,
      avg: Math.round(total / count),
    }))
    .sort((a, b) => b.avg - a.avg);

  if (hourAvgs.length > 0) {
    const topHours = hourAvgs.slice(0, 3);
    const labels = topHours.map((h) => hourLabel(h.hour)).join(", ");
    const bestAvg = topHours[0].avg;

    insights.push({
      type: "peak_hours",
      title: "Peak Demand Hours",
      description: `Your busiest time slots are at ${labels}. Consider premium pricing during these hours.`,
      metric: `${bestAvg}% avg fill rate at ${hourLabel(topHours[0].hour)}`,
      trend: "stable",
    });
  }

  // ── Slow days ──────────────────────────────────────────────

  const dayBuckets = new Map<number, { total: number; count: number }>();
  for (const slot of historicalSlots) {
    const day = slot.startTime.getDay();
    const fill =
      slot.capacity > 0 ? (slot.bookedCount / slot.capacity) * 100 : 0;
    const entry = dayBuckets.get(day) || { total: 0, count: 0 };
    entry.total += fill;
    entry.count += 1;
    dayBuckets.set(day, entry);
  }

  const dayAvgs = Array.from(dayBuckets.entries())
    .map(([day, { total, count }]) => ({
      day,
      avg: Math.round(total / count),
    }))
    .sort((a, b) => a.avg - b.avg);

  if (dayAvgs.length > 0) {
    const slowest = dayAvgs[0];
    insights.push({
      type: "slow_days",
      title: "Slowest Day of the Week",
      description: `${DAY_NAMES[slowest.day]} has the lowest average fill rate. Target discounts and promotions for this day.`,
      metric: `${slowest.avg}% avg fill rate on ${DAY_NAMES[slowest.day]}s`,
      trend: "down",
    });
  }

  // ── Trending / Declining services ──────────────────────────

  const fifteenDaysAgo = new Date(
    now.getTime() - 15 * 24 * 60 * 60 * 1000
  );

  // Split into two halves: older half (30-15 days ago) vs recent half (15-0 days ago)
  const serviceWeeks = new Map<
    string,
    { olderCount: number; recentCount: number }
  >();

  // Also fetch bookings for more accurate trending data
  const bookings = await prisma.booking.findMany({
    where: {
      businessId,
      createdAt: { gte: thirtyDaysAgo, lte: now },
    },
    include: {
      slot: { select: { serviceType: true } },
    },
  });

  for (const booking of bookings) {
    const serviceType = booking.slot.serviceType;
    const entry = serviceWeeks.get(serviceType) || {
      olderCount: 0,
      recentCount: 0,
    };
    if (booking.createdAt < fifteenDaysAgo) {
      entry.olderCount += 1;
    } else {
      entry.recentCount += 1;
    }
    serviceWeeks.set(serviceType, entry);
  }

  let bestTrend = { service: "", ratio: 0 };
  let worstTrend = { service: "", ratio: Infinity };

  for (const [service, { olderCount, recentCount }] of Array.from(serviceWeeks)) {
    // Need at least some bookings in both periods to be meaningful
    const olderNorm = Math.max(olderCount, 1);
    const ratio = recentCount / olderNorm;

    if (ratio > bestTrend.ratio) {
      bestTrend = { service, ratio };
    }
    if (ratio < worstTrend.ratio && olderCount >= 2) {
      worstTrend = { service, ratio };
    }
  }

  if (bestTrend.service && bestTrend.ratio > 1) {
    const pctIncrease = Math.round((bestTrend.ratio - 1) * 100);
    insights.push({
      type: "trending_service",
      title: `Trending: ${bestTrend.service}`,
      description: `${bestTrend.service} bookings increased ${pctIncrease}% in the recent 15 days compared to the prior period. Consider expanding capacity.`,
      metric: `+${pctIncrease}% bookings`,
      trend: "up",
    });
  }

  if (
    worstTrend.service &&
    worstTrend.ratio < 1 &&
    worstTrend.ratio < Infinity
  ) {
    const pctDecrease = Math.round((1 - worstTrend.ratio) * 100);
    insights.push({
      type: "declining_service",
      title: `Declining: ${worstTrend.service}`,
      description: `${worstTrend.service} bookings dropped ${pctDecrease}% in the recent 15 days. Consider targeted promotions or discount offers.`,
      metric: `-${pctDecrease}% bookings`,
      trend: "down",
    });
  }

  // ── Optimal pricing: do discounts convert better? ──────────

  const discounted = bookings.filter((b) => b.discountPercent > 0);
  const fullPrice = bookings.filter((b) => b.discountPercent === 0);

  if (discounted.length >= 3 && fullPrice.length >= 3) {
    // Compare booking volumes relative to available slots
    // Simple heuristic: if discount bookings form a significant share, discounts are working
    const discountShare = Math.round(
      (discounted.length / bookings.length) * 100
    );
    const avgDiscount =
      discounted.length > 0
        ? Math.round(
            discounted.reduce((s, b) => s + b.discountPercent, 0) /
              discounted.length
          )
        : 0;

    const isEffective = discountShare >= 20;

    insights.push({
      type: "optimal_pricing",
      title: "Discount Effectiveness",
      description: isEffective
        ? `Discounted offers account for ${discountShare}% of bookings at an average of ${avgDiscount}% off. Discounts are driving meaningful conversions.`
        : `Only ${discountShare}% of bookings used a discount (avg ${avgDiscount}% off). Consider adjusting discount rules to improve slot fill rates.`,
      metric: `${discountShare}% of bookings discounted (avg ${avgDiscount}% off)`,
      trend: isEffective ? "up" : "stable",
    });
  }

  return insights;
}
