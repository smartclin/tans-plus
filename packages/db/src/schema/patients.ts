import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  real,
  text,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

import { timestamps } from "#@/schema/_helper";
import { clinics } from "#@/schema/clinic";
import { staff } from "#@/schema/clinical";

import { user } from "./auth";
import {
  activeStatusEnum,
  allergyCategoryEnum,
  allergySeverityEnum,
  allergyStatusEnum,
  bloodGroupEnum,
  conditionSeverityEnum,
  conditionStatusEnum,
  deliveryMethodEnum,
  documentTypeEnum,
  genderEnum,
  guardianRelationshipEnum
} from "./common";

export const patients = pgTable(
  "patients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mrn: text("mrn").unique().notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    dateOfBirth: date("date_of_birth").notNull(),
    phone: varchar("phone", { length: 50 }).notNull(),
    alternatePhone: varchar("alternate_phone", { length: 50 }),
    email: varchar("email", { length: 255 }),
    addressLine1: varchar("address_line1", { length: 255 }).notNull(),
    addressLine2: varchar("address_line2", { length: 255 }),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 100 }).notNull(),
    postalCode: varchar("postal_code", { length: 20 }).notNull(),
    country: varchar("country", { length: 100 }).notNull(),
    emergencyContactName: varchar("emergency_contact_name", { length: 100 }).notNull(),
    emergencyContactRelationship: varchar("emergency_contact_relationship", {
      length: 100
    }).notNull(),
    emergencyContactPhone: varchar("emergency_contact_phone", { length: 50 }).notNull(),
    medicalAlerts: text("medical_alerts"),
    ...timestamps,

    gender: genderEnum("gender").notNull(),
    bloodGroup: bloodGroupEnum("blood_group").notNull().default("Unknown"),
    birthWeightKg: real("birth_weight_kg"),
    birthLengthCm: real("birth_length_cm"),
    birthHeadCircumferenceCm: real("birth_head_circ_cm"),
    deliveryMethod: deliveryMethodEnum("delivery_method"),
    preferredLanguage: text("preferred_language").default("English"),
    activeStatus: activeStatusEnum("active_status").notNull().default("active"),

    notes: text("notes"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    pediatricianId: uuid("pediatrician_id").references(() => staff.id, {
      onDelete: "set null"
    }),
    clinicId: uuid("clinic_id").references(() => clinics.id, {
      onDelete: "set null"
    })
  },
  (table) => [
    index("idx_patients_mrn").on(table.mrn),
    // Composite covering index for common list queries (active patients sorted by name)
    index("idx_patients_dob").on(table.dateOfBirth),
    index("idx_patients_pediatrician_active").on(table.pediatricianId, table.activeStatus),
    index("idx_patients_user_id").on(table.userId),
    index("idx_patients_clinic_id").on(table.clinicId),
    index("idx_patients_name_active_partial")
      .on(table.lastName, table.firstName)
      .where(sql`active_status = 'active'`)
  ]
);

export const patientDocuments = pgTable("patient_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .references(() => patients.id)
    .notNull(),
  documentType: documentTypeEnum("document_type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  storageKey: varchar("storage_key", { length: 500 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  uploadedBy: text("uploaded_by")
    .references(() => user.id)
    .notNull(),
  ...timestamps
});
export const guardians = pgTable(
  "guardians",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    relationship: guardianRelationshipEnum("relationship").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    address: text("address"),
    isPrimary: boolean("is_primary").notNull().default(true),
    emergencyContact: boolean("emergency_contact").notNull().default(true),
    contactOrder: integer("contact_order").default(1),
    notes: text("notes"),
    ...timestamps
  },
  (table) => [
    // Composite: most queries filter by patient then sort/filter by isPrimary
    index("idx_guardians_patient_primary").on(table.patientId, table.isPrimary),
    index("idx_guardians_user_id").on(table.userId)
  ]
);

export const patientAllergies = pgTable(
  "patient_allergies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    allergen: text("allergen").notNull(),
    category: allergyCategoryEnum("category").notNull(),
    severity: allergySeverityEnum("severity").notNull(),
    status: allergyStatusEnum("status").notNull().default("Active"),
    reaction: text("reaction").notNull(),
    identifiedDate: date("identified_date"),
    onsetDate: date("onset_date"),
    resolutionDate: date("resolution_date"),
    notes: text("notes"),
    ...timestamps
  },
  (table) => [
    // Active allergies per patient is the dominant query pattern
    index("idx_allergies_patient_status").on(table.patientId, table.status),
    index("idx_allergies_category").on(table.category),
    index("idx_allergies_severity").on(table.severity)
  ]
);

export const patientChronicConditions = pgTable(
  "patient_chronic_conditions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    condition: text("condition").notNull(),
    icdCode: text("icd_code"),
    diagnosedDate: date("diagnosed_date").notNull(),
    status: conditionStatusEnum("status").notNull().default("Active"),
    severity: conditionSeverityEnum("severity"),
    notes: text("notes"),
    ...timestamps
  },
  (table) => [
    // Composite: always queried by patient, often filtered by status
    index("idx_conditions_patient_status").on(table.patientId, table.status),
    index("idx_conditions_icd").on(table.icdCode)
  ]
);
