/**
 * Timezone utilities for converting between business-local times and UTC.
 * Uses Intl.DateTimeFormat (no external deps) to handle DST correctly.
 */

/**
 * Get the UTC offset (in ms) for a given timezone on a specific date.
 * Positive offset means the timezone is behind UTC (e.g. PST = +28800000).
 */
function getTimezoneOffsetMs(timezone: string, refDate: Date): number {
  const utcStr = refDate.toLocaleString("en-US", { timeZone: "UTC" });
  const tzStr = refDate.toLocaleString("en-US", { timeZone: timezone });
  return new Date(utcStr).getTime() - new Date(tzStr).getTime();
}

/**
 * Convert a local time string ("09:00") on a specific date ("2026-02-10")
 * in a given timezone to a UTC Date object.
 *
 * Example: localTimeToUTC("2026-02-10", "09:00", "America/Los_Angeles")
 *   → Date("2026-02-10T17:00:00Z")  (PST is UTC-8)
 */
export function localTimeToUTC(
  dateStr: string,
  timeStr: string,
  timezone: string
): Date {
  // Build a "naive" UTC date using the local time values
  const naive = new Date(`${dateStr}T${timeStr}:00.000Z`);
  const offset = getTimezoneOffsetMs(timezone, naive);
  return new Date(naive.getTime() + offset);
}

/**
 * Get the date string (YYYY-MM-DD) for a UTC Date in a given timezone.
 * Handles the case where e.g. 2026-02-11T02:00Z is still Feb 10 in PST.
 */
export function utcToLocalDateStr(utcDate: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(utcDate);

  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  return `${year}-${month}-${day}`;
}

/**
 * Get the start of a local date in UTC.
 * E.g. startOfDayInTz("2026-02-10", "America/Los_Angeles")
 *   → Date("2026-02-10T08:00:00Z")  (midnight PST = 08:00 UTC)
 */
export function startOfDayInTz(dateStr: string, timezone: string): Date {
  return localTimeToUTC(dateStr, "00:00", timezone);
}

/**
 * Get the end of a local date in UTC (23:59:59.999).
 */
export function endOfDayInTz(dateStr: string, timezone: string): Date {
  const d = localTimeToUTC(dateStr, "23:59", timezone);
  d.setUTCSeconds(59, 999);
  return d;
}

/**
 * Format a UTC Date as a time string in a timezone (e.g. "9:00 AM").
 */
export function formatTimeInTz(utcDate: Date, timezone: string): string {
  return utcDate.toLocaleTimeString("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
