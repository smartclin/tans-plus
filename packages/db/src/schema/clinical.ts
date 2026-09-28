import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  real,
  text,
  time,
  timestamp,
  unique,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

import { timestamps } from "#@/schema/_helper";
import { user } from "#@/schema/auth";
import { clinics, departments } from "#@/schema/clinic";
import {
  appointmentPriorityEnum,
  appointmentStatusEnum,
  encounterStatusEnum,
  painScaleTypeEnum,
  prescriptionStatusEnum,
  staffRoleEnum,
  temperatureMethodEnum,
  visitTypeEnum
} from "#@/schema/common";
import { patients } from "#@/schema/patients";

// ============================================================
// STAFF — base identity for every non-patient user in the clinic
// ============================================================
export const staff = pgTable(
  "staff",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    name: text("name").notNull(),
    title: text("title").notNull(),
    role: staffRoleEnum("role").notNull(),
    licenseNumber: text("license_number").notNull(),
    avatarColor: text("avatar_color").notNull(),
    pinHash: text("pin_hash").notNull(),
    clinicId: uuid("clinic_id").references(() => clinics.id, { onDelete: "cascade" }),

    // ─── Contact & profile ──────────────────────────────────
    phone: varchar("phone", { length: 32 }),
    bio: text("bio"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    email: text("email").unique().notNull(),
    isActive: boolean("is_active").notNull().default(true),
    specialty: text("specialty").default("General Pediatrics"),
    department: text("department").default("General"),
    ...timestamps
  },
  (table) => [
    index("idx_staff_role").on(table.role),
    index("idx_staff_is_active").on(table.isActive),
    index("idx_staff_user_id").on(table.userId),
    index("idx_staff_clinic").on(table.clinicId)
    // NOTE: idx_staff_email dropped — email is already UNIQUE
  ]
);

// ============================================================
// DOCTORS — 1:1 profile extension of staff (role = 'doctor')
// All identity/contact fields live on `staff`.
// ============================================================
export const doctors = pgTable(
  "doctors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    staffId: uuid("staff_id")
      .references(() => staff.id, { onDelete: "cascade" })
      .notNull()
      .unique(), // enforces 1:1
    departmentId: uuid("department_id")
      .references(() => departments.id)
      .notNull(),
    doctorCode: varchar("doctor_code", { length: 50 }).notNull().unique(),
    registrationNumber: varchar("registration_number", { length: 100 }).notNull().unique(),
    specialization: varchar("specialization", { length: 255 }).notNull(),
    qualification: varchar("qualification", { length: 255 }),
    consultationFee: numeric("consultation_fee", { precision: 10, scale: 2 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps
  },
  (t) => [
    index("idx_doctors_department").on(t.departmentId),
    index("idx_doctors_active").on(t.isActive)
  ]
);

export const doctorSchedules = pgTable(
  "doctor_schedules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    doctorId: uuid("doctor_id")
      .references(() => doctors.id)
      .notNull(),
    dayOfWeek: integer("day_of_week").notNull(), // 0=Sun, 6=Sat
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    slotDurationMinutes: integer("slot_duration_minutes").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps
  },
  (t) => [
    index("idx_doctor_schedules_doctor").on(t.doctorId),
    unique().on(t.doctorId, t.dayOfWeek, t.startTime)
  ]
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appointmentNumber: varchar("appointment_number", { length: 50 }).notNull().unique(),
    patientId: uuid("patient_id")
      .references(() => patients.id)
      .notNull(),
    doctorId: uuid("doctor_id")
      .references(() => doctors.id)
      .notNull(),
    scheduledStart: timestamp("scheduled_start", { withTimezone: true }).notNull(),
    scheduledEnd: timestamp("scheduled_end", { withTimezone: true }).notNull(),
    status: appointmentStatusEnum("status").default("scheduled").notNull(),
    reason: varchar("reason", { length: 255 }),
    type: visitTypeEnum("type").notNull(),
    priority: appointmentPriorityEnum("priority").default("Normal"),
    notes: text("notes"),
    bookedBy: text("booked_by")
      .references(() => user.id)
      .notNull(),
    cancellationReason: text("cancellation_reason"),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps
  },
  (t) => [
    index("idx_appointments_doctor_start").on(t.doctorId, t.scheduledStart),
    index("idx_appointments_patient_start").on(t.patientId, t.scheduledStart),
    index("idx_appointments_status_start").on(t.status, t.scheduledStart),
    index("idx_appointments_patient_status").on(t.patientId, t.status)
    // Drop redundant idx_appointments_doctor_start_status (covered above)
  ]
);

export const encounters = pgTable(
  "encounters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .references(() => patients.id)
      .notNull(),
    doctorId: uuid("doctor_id")
      .references(() => doctors.id)
      .notNull(),
    appointmentId: uuid("appointment_id")
      .references(() => appointments.id)
      .unique(),
    encounterNumber: varchar("encounter_number", { length: 50 }).notNull().unique(),
    status: encounterStatusEnum("status").default("in_progress").notNull(),
    chiefComplaint: text("chief_complaint").notNull(),
    history: text("history"),
    examinationNotes: text("examination_notes"),
    diagnosisSummary: text("diagnosis_summary"),
    temperatureC: real("temperature_c").notNull(),
    temperatureMethod: temperatureMethodEnum("temperature_method").default("Axillary"),
    systolicBp: integer("systolic_bp"),
    diastolicBp: integer("diastolic_bp"),
    oxygenSaturationPercent: integer("oxygen_saturation_percent").notNull(),
    painScore: integer("pain_score").default(0),
    painScaleType: painScaleTypeEnum("pain_scale_type").default("Wong-Baker"),
    weightKg: real("weight_kg"),
    heightCm: real("height_cm"),
    headCircumferenceCm: real("head_circumference_cm"),
    bmi: real("bmi"),
    notes: text("notes"),
    treatmentPlan: text("treatment_plan"),
    followUpAt: timestamp("follow_up_at", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps
  },
  (t) => [
    index("idx_encounters_patient_started").on(t.patientId, t.startedAt.desc()),
    index("idx_encounters_doctor_started").on(t.doctorId, t.startedAt.desc())
  ]
);

export const diagnoses = pgTable(
  "diagnoses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    encounterId: uuid("encounter_id")
      .references(() => encounters.id)
      .notNull(),
    code: varchar("code", { length: 50 }),
    description: text("description").notNull(),
    isPrimary: boolean("is_primary").default(false).notNull(),
    ...timestamps
  },
  (t) => [
    index("idx_diagnoses_encounter").on(t.encounterId),
    index("idx_diagnoses_code").on(t.code)
  ]
);

export const prescriptions = pgTable(
  "prescriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    prescriptionNumber: varchar("prescription_number", { length: 50 }).notNull().unique(),
    encounterId: uuid("encounter_id")
      .references(() => encounters.id)
      .notNull(),
    patientId: uuid("patient_id")
      .references(() => patients.id)
      .notNull(),
    doctorId: uuid("doctor_id")
      .references(() => doctors.id)
      .notNull(),
    // ✅ prescriberId is now a real FK to staff.id
    prescriberId: uuid("prescriber_id")
      .references(() => staff.id, { onDelete: "restrict" })
      .notNull(),
    status: prescriptionStatusEnum("status").default("active").notNull(),
    // Snapshots — immutable legal record
    prescriberName: text("prescriber_name").notNull(),
    prescriberLicense: text("prescriber_license").notNull(),
    patientWeightKg: real("patient_weight_kg").notNull(),
    diagnosis: text("diagnosis"),
    notes: text("notes"),
    filledAt: timestamp("filled_at", { withTimezone: true }),
    filledBy: text("filled_by").references(() => user.id),
    discontinuedAt: timestamp("discontinued_at", { withTimezone: true }),
    discontinuedReason: text("discontinued_reason"),
    prescribedAt: timestamp("prescribed_at", { withTimezone: true }).defaultNow().notNull(),
    ...timestamps
  },
  (table) => [
    index("idx_prescriptions_patient_active")
      .on(table.patientId)
      .where(sql`status = 'active'`),
    index("idx_prescriptions_patient_status").on(table.patientId, table.status),
    index("idx_prescriptions_prescriber").on(table.prescriberId),
    index("idx_prescriptions_doctor_prescribed").on(table.doctorId, table.prescribedAt.desc()),
    index("idx_prescriptions_encounter").on(table.encounterId)
    // Drop idx_prescriptions_rx_number — prescriptionNumber is UNIQUE
  ]
);

export const prescriptionItems = pgTable(
  "prescription_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    prescriptionId: uuid("prescription_id")
      .references(() => prescriptions.id)
      .notNull(),
    medicineId: uuid("medicine_id"), // nullable, can be from catalog or free text
    medicineNameSnapshot: varchar("medicine_name_snapshot", { length: 255 }).notNull(),
    dosage: varchar("dosage", { length: 100 }).notNull(),
    route: varchar("route", { length: 100 }),
    frequency: varchar("frequency", { length: 100 }).notNull(),
    duration: varchar("duration", { length: 100 }).notNull(),
    quantity: integer("quantity"),
    instructions: text("instructions"),
    ...timestamps
  },
  (t) => [
    index("idx_prescription_items_prescription").on(t.prescriptionId),
    index("idx_prescription_items_medicine").on(t.medicineId)
  ]
);

export const growthMeasurements = pgTable(
  "growth_measurements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    encounterId: uuid("encounter_id").references(() => encounters.id, {
      onDelete: "set null"
    }),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
    ageMonths: real("age_months").notNull(),
    ageDays: integer("age_days"),
    weightKg: real("weight_kg").notNull(),
    heightCm: real("height_cm").notNull(),
    headCircumferenceCm: real("head_circ_cm"),
    bmi: real("bmi").notNull(),
    weightForAgeZScore: real("weight_for_age_zscore"),
    weightForAgePercentile: real("weight_for_age_percentile"),
    heightForAgeZScore: real("height_for_age_zscore"),
    heightForAgePercentile: real("height_for_age_percentile"),
    bmiForAgeZScore: real("bmi_for_age_zscore"),
    bmiForAgePercentile: real("bmi_for_age_percentile"),
    headCircumferenceZScore: real("head_circ_zscore"),
    headCircumferencePercentile: real("head_circ_percentile"),
    weightVelocity: real("weight_velocity"),
    heightVelocity: real("height_velocity"),
    // ✅ now a proper FK — was free text
    recordedBy: text("recorded_by")
      .references(() => user.id)
      .notNull(),
    notes: text("notes"),
    ...timestamps
  },
  (table) => [
    index("idx_growth_patient_recorded").on(table.patientId, table.recordedAt.desc()),
    index("idx_growth_patient_age").on(table.patientId, table.ageMonths),
    index("idx_growth_encounter").on(table.encounterId)
  ]
);
