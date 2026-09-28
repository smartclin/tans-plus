import { z } from "zod";

// ─── Enums mirror schema/common.ts ───────────────────────────
export const appointmentStatusSchema = z.enum([
  "scheduled",
  "checked_in",
  "in_progress",
  "completed",
  "cancelled",
  "no_show"
]);

export const appointmentPrioritySchema = z.enum(["Normal", "Urgent", "Emergency"]);

export const visitTypeSchema = z.enum([
  "Well-Child Check",
  "Sick Visit",
  "Follow-Up",
  "Immunization Visit",
  "Consultation",
  "Lactation Consultation",
  "Emergency/Urgent",
  "Telehealth",
  "Other"
]);

// ─── Create ──────────────────────────────────────────────────
// FIXED: `type` is NOT NULL on schema — now required.
// `bookedBy` is NOT NULL FK to user — server-injected.
export const createAppointmentSchema = z
  .object({
    patientId: z.string().uuid(),
    doctorId: z.string().uuid(),
    scheduledStart: z.coerce.date(),
    scheduledEnd: z.coerce.date(),
    type: visitTypeSchema,
    priority: appointmentPrioritySchema.default("Normal"),
    reason: z.string().max(255).optional(),
    notes: z.string().optional()
  })
  .refine((data) => data.scheduledEnd > data.scheduledStart, {
    message: "scheduledEnd must be after scheduledStart",
    path: ["scheduledEnd"]
  });

export type CreateAppointmentServerInput = z.infer<typeof createAppointmentSchema> & {
  bookedBy: string; // user.id — from auth session
};

export const updateAppointmentSchema = z.object({
  scheduledStart: z.coerce.date().optional(),
  scheduledEnd: z.coerce.date().optional(),
  status: appointmentStatusSchema.optional(),
  priority: appointmentPrioritySchema.optional(),
  reason: z.string().max(255).optional(),
  notes: z.string().optional(),
  cancellationReason: z.string().optional(),
  checkedInAt: z.coerce.date().optional(),
  startedAt: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional()
});

export const appointmentStatusTransitionSchema = z.object({
  status: appointmentStatusSchema,
  cancellationReason: z.string().optional()
});

// ─── List query ──────────────────────────────────────────────
export const appointmentListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  doctorId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  status: appointmentStatusSchema.optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional()
});

// ─── Types ───────────────────────────────────────────────────
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;
export type VisitType = z.infer<typeof visitTypeSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type AppointmentListQuery = z.infer<typeof appointmentListQuerySchema>;
