import { z } from "zod";
// validations/clinical.ts

export const createDepartmentSchema = z.object({
  code: z.string().min(1, "Department code is required").max(50),
  name: z.string().min(1, "Department name is required").max(100),
  description: z.string().max(500).optional()
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

export const createDoctorSchema = z.object({
  // ── staff.* — NOT NULL, no DB default ────────────────────
  name: z.string().min(1, "Name is required").max(255),
  title: z.string().min(1, "Title is required").max(100),
  avatarColor: z.string().min(1, "Avatar color is required").max(50),
  pinHash: z.string().min(1, "PIN hash is required").max(255),
  userId: z.string().min(1, "User ID is required"),

  // ── staff.* — required / optional ────────────────────────
  email: z.string().email("Valid email is required"),
  phone: z.string().max(32).optional(),
  clinicId: z.string().uuid().optional(),
  bio: z.string().optional(),
  specialty: z.string().optional(),
  department: z.string().optional(), // ← free-text staff.department (default "General")

  // ── doctors.* ────────────────────────────────────────────
  departmentId: z.string().uuid("Valid department ID is required"), // FK → departments.id
  doctorCode: z.string().min(1, "Doctor code is required").max(50),
  registrationNumber: z.string().min(1, "Registration number is required").max(100),
  specialization: z.string().min(1, "Specialization is required").max(255),
  qualification: z.string().max(255).optional(),
  consultationFee: z.coerce.number().min(0, "Consultation fee must be >= 0")
});

export const createDoctorScheduleSchema = z.object({
  doctorId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Start time must be HH:MM"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "End time must be HH:MM"),
  slotDurationMinutes: z.number().int().positive().default(15)
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type CreateDoctorScheduleInput = z.infer<typeof createDoctorScheduleSchema>;
export const createDoctorProfileSchema = z.object({
  staffId: z.string().uuid(), // FK to staff.id — required
  departmentId: z.string().uuid(),
  doctorCode: z.string().min(1).max(50),
  registrationNumber: z.string().min(1).max(100),
  specialization: z.string().min(1).max(255),
  qualification: z.string().max(255).optional(),
  consultationFee: z.coerce.number().min(0),
  isActive: z.boolean().default(true)
});

export const updateDoctorSchema = createDoctorSchema.partial();

export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type CreateDoctorProfileInput = z.infer<typeof createDoctorProfileSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
