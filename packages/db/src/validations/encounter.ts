import { z } from "zod";

// ─── Enums ───────────────────────────────────────────────────
export const encounterStatusSchema = z.enum(["in_progress", "completed", "cancelled"]);

export const temperatureMethodSchema = z.enum([
  "Axillary",
  "Oral",
  "Rectal",
  "Tympanic",
  "Temporal"
]);

export const painScaleTypeSchema = z.enum(["Wong-Baker", "Numeric", "FLACC", "Neonatal"]);

// ─── Create Encounter ────────────────────────────────────────
// CRITICAL: schema has NOT NULL on temperatureC and oxygenSaturationPercent.
// These were missing from the original validation.
export const createEncounterSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  encounterNumber: z.string().min(1).max(50), // NOT NULL UNIQUE — or generate server-side
  status: encounterStatusSchema.default("in_progress"),
  chiefComplaint: z.string().min(1),

  // Vitals — required
  temperatureC: z.coerce.number().min(20).max(45),
  temperatureMethod: temperatureMethodSchema.default("Axillary"),
  oxygenSaturationPercent: z.coerce.number().int().min(0).max(100),

  // Vitals — optional
  systolicBp: z.coerce.number().int().positive().optional(),
  diastolicBp: z.coerce.number().int().positive().optional(),
  painScore: z.coerce.number().int().min(0).max(10).default(0),
  painScaleType: painScaleTypeSchema.default("Wong-Baker"),
  weightKg: z.coerce.number().positive().optional(),
  heightCm: z.coerce.number().positive().optional(),
  headCircumferenceCm: z.coerce.number().positive().optional(),
  bmi: z.coerce.number().positive().optional(),

  // Narrative
  history: z.string().optional(),
  examinationNotes: z.string().optional(),
  diagnosisSummary: z.string().optional(),
  treatmentPlan: z.string().optional(),
  notes: z.string().optional(),
  followUpAt: z.coerce.date().optional(),

  // Meta
  startedAt: z.coerce.date().optional() // defaults to now() in schema
});

// Server may generate encounterNumber — mark as optional on server input
export type CreateEncounterServerInput = Omit<
  z.infer<typeof createEncounterSchema>,
  "encounterNumber"
> & {
  encounterNumber?: string;
};

export const updateEncounterSchema = createEncounterSchema.partial().omit({
  patientId: true,
  doctorId: true
});

// ─── Diagnosis ───────────────────────────────────────────────
export const addDiagnosisSchema = z.object({
  code: z.string().max(50).optional(),
  description: z.string().min(1),
  isPrimary: z.boolean().default(false)
});

// ─── Prescription ────────────────────────────────────────────
// NOTE: `prescriptions` has NOT NULL fields the client can't supply:
//   prescriberId, prescriberName, prescriberLicense, patientWeightKg
// These come from staff session + patient record — server-injected.
export const addPrescriptionItemSchema = z.object({
  medicineId: z.string().uuid().optional(),
  medicineNameSnapshot: z.string().min(1).max(255),
  dosage: z.string().min(1).max(100),
  route: z.string().max(100).optional(),
  frequency: z.string().min(1).max(100),
  duration: z.string().min(1).max(100),
  quantity: z.coerce.number().int().positive().optional(),
  instructions: z.string().optional()
});

export const addPrescriptionSchema = z.object({
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(addPrescriptionItemSchema).min(1)
});

export type AddPrescriptionServerInput = z.infer<typeof addPrescriptionSchema> & {
  prescriberId: string; // staff.id
  prescriberName: string;
  prescriberLicense: string;
  patientWeightKg: number;
};

// ─── Types ───────────────────────────────────────────────────
export type EncounterStatus = z.infer<typeof encounterStatusSchema>;
export type CreateEncounterInput = z.infer<typeof createEncounterSchema>;
export type UpdateEncounterInput = z.infer<typeof updateEncounterSchema>;
export type AddDiagnosisInput = z.infer<typeof addDiagnosisSchema>;
export type AddPrescriptionInput = z.infer<typeof addPrescriptionSchema>;
