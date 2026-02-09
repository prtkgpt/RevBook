import { DiscountRule, Slot } from "@prisma/client";
import { differenceInHours, getDay } from "date-fns";

/**
 * Evaluate whether a slot matches a discount rule.
 * Returns true if ALL conditions on the rule are satisfied.
 */
export function evaluateRule(rule: DiscountRule, slot: Slot, now: Date): boolean {
  // Check hours before slot
  if (rule.hoursBeforeSlot !== null) {
    const hoursUntilSlot = differenceInHours(slot.startTime, now);
    if (hoursUntilSlot > rule.hoursBeforeSlot || hoursUntilSlot < 0) {
      return false;
    }
  }

  // Check booked percentage
  if (rule.maxBookedPercent !== null) {
    const bookedPercent = slot.capacity > 0
      ? (slot.bookedCount / slot.capacity) * 100
      : 100;
    if (bookedPercent >= rule.maxBookedPercent) {
      return false;
    }
  }

  // Check day of week (ISO: 1=Mon, 7=Sun; JS getDay: 0=Sun, 6=Sat)
  if (rule.daysOfWeek) {
    const allowedDays = rule.daysOfWeek.split(",").map(Number);
    const jsDay = getDay(slot.startTime); // 0=Sun
    const isoDay = jsDay === 0 ? 7 : jsDay; // Convert to ISO
    if (!allowedDays.includes(isoDay)) {
      return false;
    }
  }

  // Check time of day
  const slotHour = slot.startTime.getHours();
  const slotMinute = slot.startTime.getMinutes();
  const slotTimeMinutes = slotHour * 60 + slotMinute;

  if (rule.afterTimeOfDay) {
    const [h, m] = rule.afterTimeOfDay.split(":").map(Number);
    if (slotTimeMinutes < h * 60 + m) {
      return false;
    }
  }

  if (rule.beforeTimeOfDay) {
    const [h, m] = rule.beforeTimeOfDay.split(":").map(Number);
    if (slotTimeMinutes >= h * 60 + m) {
      return false;
    }
  }

  // Check service types
  if (rule.serviceTypes) {
    const allowedTypes = rule.serviceTypes.split(",").map((s) => s.trim().toLowerCase());
    if (!allowedTypes.includes(slot.serviceType.toLowerCase())) {
      return false;
    }
  }

  return true;
}

/**
 * Find the best matching rule for a slot (highest priority first).
 */
export function findBestRule(
  rules: DiscountRule[],
  slot: Slot,
  now: Date
): DiscountRule | null {
  const sorted = [...rules]
    .filter((r) => r.enabled)
    .sort((a, b) => b.priority - a.priority);

  for (const rule of sorted) {
    if (evaluateRule(rule, slot, now)) {
      return rule;
    }
  }

  return null;
}

/**
 * Calculate the discounted price.
 */
export function calculateDiscountedPrice(
  basePriceCents: number,
  discountPercent: number
): number {
  return Math.round(basePriceCents * (1 - discountPercent / 100));
}

/**
 * Get a slot's fill health status for the dashboard.
 */
export function getSlotHealth(
  slot: Slot,
  hoursUntilSlot: number
): "HEALTHY" | "AT_RISK" | "LIKELY_EMPTY" {
  const fillPercent =
    slot.capacity > 0 ? (slot.bookedCount / slot.capacity) * 100 : 0;

  if (fillPercent >= 75) return "HEALTHY";
  if (fillPercent >= 25 || hoursUntilSlot > 48) return "AT_RISK";
  return "LIKELY_EMPTY";
}
