import { z } from "zod";

// ── Business ──
export const businessSchema = z.object({
  name: z.string().min(1, "Business name is required").max(100),
  timezone: z.string().min(1, "Timezone is required"),
  bookingBaseUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});
export type BusinessInput = z.infer<typeof businessSchema>;

// ── Slot ──
export const slotSchema = z.object({
  serviceType: z.string().min(1, "Service type is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1"),
  bookedCount: z.coerce.number().int().min(0).default(0),
  basePriceCents: z.coerce.number().int().min(0, "Price must be non-negative"),
});
export type SlotInput = z.infer<typeof slotSchema>;

// ── Discount Rule ──
export const discountRuleSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  enabled: z.boolean().default(true),
  priority: z.coerce.number().int().default(0),
  hoursBeforeSlot: z.coerce.number().int().min(1).nullable().optional(),
  maxBookedPercent: z.coerce.number().int().min(0).max(100).nullable().optional(),
  daysOfWeek: z.string().nullable().optional(),
  afterTimeOfDay: z.string().nullable().optional(),
  beforeTimeOfDay: z.string().nullable().optional(),
  serviceTypes: z.string().nullable().optional(),
  discountPercent: z.coerce.number().int().min(1).max(100),
});
export type DiscountRuleInput = z.infer<typeof discountRuleSchema>;

// ── Customer ──
export const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  tags: z.string().optional().or(z.literal("")),
});
export type CustomerInput = z.infer<typeof customerSchema>;
