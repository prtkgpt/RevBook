import { prisma } from "@/lib/prisma";
import { localTimeToUTC, utcToLocalDateStr } from "@/lib/timezone";

interface TimeWindow {
  start: string; // "09:00"
  end: string;   // "17:00"
}

type WeeklyHours = Record<string, TimeWindow[]>; // "0"-"6" => windows

/**
 * Generate individual Slot records from a SlotTemplate for the next N days.
 * Times in weeklyHours are interpreted in the business timezone.
 * Skips any slots whose startTime already exists for this template.
 */
export async function generateSlotsFromTemplate(templateId: string) {
  const template = await prisma.slotTemplate.findUnique({
    where: { id: templateId },
    include: { business: { select: { timezone: true } } },
  });

  if (!template || !template.enabled) return { created: 0, skipped: 0 };

  const timezone = template.business.timezone || "America/New_York";
  const weeklyHours: WeeklyHours = JSON.parse(template.weeklyHours);
  const now = new Date();
  const minNotice = template.minNoticeHours * 60 * 60 * 1000;
  const endDate = new Date(now.getTime() + template.daysInAdvance * 24 * 60 * 60 * 1000);

  // Get existing slots for this template so we don't create duplicates
  const existingSlots = await prisma.slot.findMany({
    where: {
      templateId: template.id,
      startTime: { gte: now },
    },
    select: { startTime: true },
  });

  const existingTimes = new Set(
    existingSlots.map((s) => s.startTime.getTime())
  );

  const slotsToCreate: Array<{
    businessId: string;
    templateId: string;
    serviceType: string;
    startTime: Date;
    endTime: Date;
    capacity: number;
    basePriceCents: number;
  }> = [];

  // Iterate each day from today to endDate
  // Use the business timezone to determine dates and day-of-week
  const currentDate = new Date(now);
  currentDate.setUTCHours(0, 0, 0, 0);

  // Start from today in the business timezone
  const todayStr = utcToLocalDateStr(now, timezone);
  let dateCursor = new Date(todayStr + "T00:00:00Z");

  while (dateCursor <= endDate) {
    const dateStr = dateCursor.toISOString().split("T")[0]; // YYYY-MM-DD

    // Day of week in the business timezone (0=Sunday)
    const localDate = new Date(dateStr + "T12:00:00Z"); // noon to avoid edge cases
    const dayOfWeek = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
    }).format(localDate);

    // Map weekday name to number
    const dayMap: Record<string, string> = {
      Sun: "0", Mon: "1", Tue: "2", Wed: "3", Thu: "4", Fri: "5", Sat: "6",
    };
    const dayKey = dayMap[dayOfWeek] || "0";
    const windows = weeklyHours[dayKey] || [];

    for (const window of windows) {
      const [startH, startM] = window.start.split(":").map(Number);
      const [endH, endM] = window.end.split(":").map(Number);

      // Create slots at durationMinutes + bufferMinutes intervals within this window
      const slotInterval = template.durationMinutes + template.bufferMinutes;
      let slotStartMinutes = startH * 60 + startM;
      const windowEndMinutes = endH * 60 + endM;

      while (slotStartMinutes + template.durationMinutes <= windowEndMinutes) {
        const h = Math.floor(slotStartMinutes / 60);
        const m = slotStartMinutes % 60;
        const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;

        // Convert business-local time to UTC
        const slotStart = localTimeToUTC(dateStr, timeStr, timezone);
        const slotEnd = new Date(
          slotStart.getTime() + template.durationMinutes * 60 * 1000
        );

        // Skip if too soon (min notice)
        if (slotStart.getTime() - now.getTime() >= minNotice) {
          // Skip if already exists
          if (!existingTimes.has(slotStart.getTime())) {
            slotsToCreate.push({
              businessId: template.businessId,
              templateId: template.id,
              serviceType: template.name,
              startTime: slotStart,
              endTime: slotEnd,
              capacity: template.capacity,
              basePriceCents: template.basePriceCents,
            });
          }
        }

        slotStartMinutes += slotInterval;
      }
    }

    // Next day
    dateCursor = new Date(dateCursor.getTime() + 24 * 60 * 60 * 1000);
  }

  if (slotsToCreate.length === 0) return { created: 0, skipped: existingSlots.length };

  // Batch create
  const result = await prisma.slot.createMany({
    data: slotsToCreate,
    skipDuplicates: true,
  });

  // Update lastGeneratedAt
  await prisma.slotTemplate.update({
    where: { id: templateId },
    data: { lastGeneratedAt: new Date() },
  });

  return { created: result.count, skipped: existingSlots.length };
}
