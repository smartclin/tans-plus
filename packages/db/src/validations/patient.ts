import { z } from "zod";

// ─── Enums mirror schema/common.ts exactly ───────────────────
export const genderSchema = z.enum(["male", "female", "other"]);

export const bloodGroupSchema = z.enum([
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "Unknown"
]);

export const activeStatusSchema = z.enum(["active", "inactive", "suspended", "archived"]);

export const deliveryMethodSchema = z.enum(["Vaginal", "Cesarean", "Assisted"]);

export const guardianRelationshipSchema = z.enum([
  "Mother",
  "Father",
  "Grandparent",
  "Legal Guardian",
  "Foster Parent",
  "Other"
]);

export const preferredLanguageSchema = z.enum(["English", "Arabic", "French", "Spanish", "Other"]);

// ─── List query ──────────────────────────────────────────────
// FIXED: sort enum uses `mrn` (the actual schema column) not `patientNumber`
export const patientListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  gender: genderSchema.optional(),
  activeStatus: activeStatusSchema.optional(),
  sort: z.enum(["createdAt", "firstName", "lastName", "mrn"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc")
});

// ─── Create patient ──────────────────────────────────────────
// NOTE: `mrn` and `userId` are NOT in the client payload.
// `userId` comes from auth session, `mrn` is generated server-side.
export const createPatientSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be YYYY-MM-DD"),
  gender: genderSchema,
  bloodGroup: bloodGroupSchema.default("Unknown"),
  phone: z.string().min(1).max(50),
  alternatePhone: z.string().max(50).optional(),
  email: z.string().email().optional().or(z.literal("")),
  addressLine1: z.string().min(1).max(255),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  country: z.string().min(1).max(100),
  emergencyContactName: z.string().min(1).max(100),
  emergencyContactRelationship: z.string().min(1).max(100),
  emergencyContactPhone: z.string().min(1).max(50),
  medicalAlerts: z.string().optional(),
  notes: z.string().optional(),

  // Optional clinical sub-records (removed flat `allergies` string)
  birthWeightKg: z.coerce.number().positive().optional(),
  birthLengthCm: z.coerce.number().positive().optional(),
  birthHeadCircumferenceCm: z.coerce.number().positive().optional(),
  deliveryMethod: deliveryMethodSchema.optional(),
  preferredLanguage: preferredLanguageSchema.optional(),
  pediatricianId: z.string().uuid().optional(),
  clinicId: z.string().uuid().optional()
});

// Server-injected fields — never trust these from the client
export type CreatePatientServerInput = z.infer<typeof createPatientSchema> & {
  mrn: string;
  userId: string;
};

export const updatePatientSchema = createPatientSchema.partial();
export const updatePatientServerSchema = updatePatientSchema; // no extra server fields on update

// ─── Sub-records (were missing entirely) ─────────────────────
export const createGuardianSchema = z.object({
  name: z.string().min(1).max(100),
  relationship: guardianRelationshipSchema,
  phone: z.string().min(1).max(50),
  email: z.string().email().optional(),
  address: z.string().optional(),
  isPrimary: z.boolean().default(true),
  emergencyContact: z.boolean().default(true),
  contactOrder: z.coerce.number().int().positive().default(1),
  notes: z.string().optional()
});

export const createPatientAllergySchema = z.object({
  allergen: z.string().min(1).max(255),
  category: z.enum(["Medication", "Food", "Environmental", "Other"]),
  severity: z.enum(["Mild", "Moderate", "Severe", "Anaphylactic"]),
  status: z.enum(["Active", "Resolved", "Inactive"]).default("Active"),
  reaction: z.string().min(1),
  identifiedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  onsetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  resolutionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  notes: z.string().optional()
});

export const createPatientChronicConditionSchema = z.object({
  condition: z.string().min(1),
  icdCode: z.string().max(50).optional(),
  diagnosedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["Active", "Resolved", "In Remission"]).default("Active"),
  severity: z.enum(["Mild", "Moderate", "Severe"]).optional(),
  notes: z.string().optional()
});

// ─── Types ───────────────────────────────────────────────────
export type Gender = z.infer<typeof genderSchema>;
export type BloodGroup = z.infer<typeof bloodGroupSchema>;
export type PatientListQuery = z.infer<typeof patientListQuerySchema>;
export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type CreateGuardianInput = z.infer<typeof createGuardianSchema>;
export type CreatePatientAllergyInput = z.infer<typeof createPatientAllergySchema>;
export type CreatePatientChronicConditionInput = z.infer<
  typeof createPatientChronicConditionSchema
>;
