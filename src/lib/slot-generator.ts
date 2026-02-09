import { prisma } from "@/lib/prisma";

interface TimeWindow {
  start: string; // "09:00"
  end: string;   // "17:00"
}

type WeeklyHours = Record<string, TimeWindow[]>; // "0"-"6" => windows

/**
 * Generate individual Slot records from a SlotTemplate for the next N days.
 * Skips any slots whose startTime already exists for this template.
 */
export async function generateSlotsFromTemplate(templateId: string) {
  const template = await prisma.slotTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template || !template.enabled) return { created: 0, skipped: 0 };

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
  const current = new Date(now);
  current.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    const dayOfWeek = current.getDay().toString(); // 0=Sunday
    const windows = weeklyHours[dayOfWeek] || [];

    for (const window of windows) {
      const [startH, startM] = window.start.split(":").map(Number);
      const [endH, endM] = window.end.split(":").map(Number);

      // Create slots at durationMinutes + bufferMinutes intervals within this window
      const slotInterval = template.durationMinutes + template.bufferMinutes;
      let slotStartMinutes = startH * 60 + startM;
      const windowEndMinutes = endH * 60 + endM;

      while (slotStartMinutes + template.durationMinutes <= windowEndMinutes) {
        const slotStart = new Date(current);
        slotStart.setHours(
          Math.floor(slotStartMinutes / 60),
          slotStartMinutes % 60,
          0,
          0
        );

        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + template.durationMinutes);

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

    current.setDate(current.getDate() + 1);
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
