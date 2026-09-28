import { z } from "zod";

// ─── Enums ───────────────────────────────────────────────────
export const wardTypeSchema = z.enum(["Pediatric", "NICU", "PICU", "General", "Isolation"]);

export const roomTypeSchema = z.enum(["Private", "Semi-Private", "Ward", "Isolation"]);

export const bedStatusSchema = z.enum(["available", "occupied", "maintenance"]);

export const admissionStatusSchema = z.enum(["admitted", "discharged", "cancelled"]);

export const clinicalNoteTypeSchema = z.enum([
  "Progress",
  "Admission",
  "Discharge",
  "Consultation",
  "Nursing",
  "Procedure",
  "Other"
]);

// ─── Ward ────────────────────────────────────────────────────
export const createWardSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  type: wardTypeSchema,
  isActive: z.boolean().default(true)
});

export const updateWardSchema = createWardSchema.partial();

// ─── Room ────────────────────────────────────────────────────
export const createRoomSchema = z.object({
  wardId: z.string().uuid(),
  roomNumber: z.string().min(1).max(50),
  roomType: roomTypeSchema,
  dailyRate: z.coerce.number().min(0),
  isActive: z.boolean().default(true)
});

// ─── Bed ─────────────────────────────────────────────────────
export const createBedSchema = z.object({
  roomId: z.string().uuid(),
  bedNumber: z.string().min(1).max(50),
  status: bedStatusSchema.default("available"),
  isActive: z.boolean().default(true)
});

// ─── Admission ───────────────────────────────────────────────
// FIXED: `createdBy` NOT NULL — server-injected.
// FIXED: `admissionNumber` NOT NULL UNIQUE — server-generated.
export const createAdmissionSchema = z.object({
  patientId: z.string().uuid(),
  attendingDoctorId: z.string().uuid(),
  admissionReason: z.string().min(1).max(500),
  expectedDischargeAt: z.coerce.date().optional(),
  bedId: z.string().uuid().optional() // triggers initial bed allocation
});

export type CreateAdmissionServerInput = z.infer<typeof createAdmissionSchema> & {
  admissionNumber: string;
  createdBy: string; // user.id
};

export const dischargeAdmissionSchema = z.object({
  dischargeSummary: z.string().min(1).max(2000)
});

// ─── Bed Allocation ──────────────────────────────────────────
export const allocateBedSchema = z.object({
  bedId: z.string().uuid()
});

export const transferBedSchema = z.object({
  newBedId: z.string().uuid(),
  transferReason: z.string().max(500).optional()
});

// ─── Clinical Note ───────────────────────────────────────────
// FIXED: `authorUserId` NOT NULL — server-injected.
export const addClinicalNoteSchema = z.object({
  noteType: clinicalNoteTypeSchema,
  noteText: z.string().min(1).max(5000)
});

export type AddClinicalNoteServerInput = z.infer<typeof addClinicalNoteSchema> & {
  admissionId: string;
  authorUserId: string; // user.id
};

// ─── Types ───────────────────────────────────────────────────
export type WardType = z.infer<typeof wardTypeSchema>;
export type RoomType = z.infer<typeof roomTypeSchema>;
export type AdmissionStatus = z.infer<typeof admissionStatusSchema>;
export type ClinicalNoteType = z.infer<typeof clinicalNoteTypeSchema>;
export type CreateWardInput = z.infer<typeof createWardSchema>;
export type UpdateWardInput = z.infer<typeof updateWardSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type CreateBedInput = z.infer<typeof createBedSchema>;
export type CreateAdmissionInput = z.infer<typeof createAdmissionSchema>;
export type DischargeAdmissionInput = z.infer<typeof dischargeAdmissionSchema>;
export type AllocateBedInput = z.infer<typeof allocateBedSchema>;
export type TransferBedInput = z.infer<typeof transferBedSchema>;
export type AddClinicalNoteInput = z.infer<typeof addClinicalNoteSchema>;
