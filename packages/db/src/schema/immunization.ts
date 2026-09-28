import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

import { timestamps } from "#@/schema/_helper";
import { user } from "#@/schema/auth";
import { encounters, staff } from "#@/schema/clinical";
import {
  immunizationStatusEnum,
  medicalRecordStatusEnum,
  medicalRecordTypeEnum,
  metricTypeEnum,
  whoGenderEnum,
  type JsonValue
} from "#@/schema/common";
import { patients } from "#@/schema/patients";

export const immunizations = pgTable(
  "immunizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    vaccineCode: text("vaccine_code").notNull(),
    vaccineName: text("vaccine_name").notNull(),
    targetDisease: text("target_disease").notNull(),
    doseNumber: integer("dose_number").notNull(),
    totalDoses: integer("total_doses"),
    recommendedAgeLabel: text("recommended_age_label").notNull(),
    recommendedAgeMonths: real("recommended_age_months").notNull(),
    dueDate: date("due_date").notNull(),
    administeredDate: date("administered_date"),
    status: immunizationStatusEnum("status").notNull().default("Due"),
    manufacturer: text("manufacturer"),
    brandName: text("brand_name"),
    batchNumber: text("batch_number"),
    expiryDate: date("expiry_date"),
    administrationSite: text("administration_site"),
    administrationRoute: text("administration_route"),
    administeredBy: text("administered_by").references(() => user.id),
    adverseReactions: text("adverse_reactions"),
    parentConsent: boolean("parent_consent").default(false),
    consentFormId: text("consent_form_id"),
    notes: text("notes"),
    ...timestamps
  },
  (table) => [
    index("idx_immunizations_patient_administered").on(table.patientId, table.administeredDate),

    // Dashboard: due/overdue immunizations per patient
    index("idx_immunizations_patient_status").on(table.patientId, table.status),
    // Schedule lookups by due date
    index("idx_immunizations_due_date").on(table.dueDate),
    index("idx_immunizations_vaccine_code").on(table.vaccineCode)
  ]
);

export const whoGrowthData = pgTable(
  "who_growth_data",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gender: whoGenderEnum("gender").notNull(),
    metricType: metricTypeEnum("metric_type").notNull(),
    ageDays: integer("age_days"),
    ageMonths: real("age_months").notNull(),
    // LMS Parameters
    L: real("l_value").notNull(),
    M: real("m_value").notNull(),
    S: real("s_value").notNull(),
    // Standard Deviation values for quick lookup
    sd4neg: real("sd_4neg"),
    sd3neg: real("sd_3neg"),
    sd2neg: real("sd_2neg"),
    sd1neg: real("sd_1neg"),
    sd0: real("sd_0"),
    sd1: real("sd_1"),
    sd2: real("sd_2"),
    sd3: real("sd_3"),
    sd4: real("sd_4"),
    // Metadata
    dataSource: text("data_source").default("WHO"),
    version: text("version").default("2006"),
    ...timestamps
  },
  (t) => [uniqueIndex("who_gender_metric_age_idx").on(t.gender, t.metricType, t.ageMonths)]
);

// ============================================================
// MEDICAL RECORDS
// Stores documents and attachments linked to a patient and
// optionally to a specific encounter. Separate from SOAP note
// JSON blobs — this tracks external/uploaded files and reports.
// ============================================================
export const medicalRecords = pgTable(
  "medical_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    encounterId: uuid("encounter_id").references(() => encounters.id, {
      onDelete: "set null"
    }),
    uploadedBy: uuid("uploaded_by")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    // Document classification
    recordType: medicalRecordTypeEnum("record_type").notNull(),
    status: medicalRecordStatusEnum("status").notNull().default("Active"),
    title: text("title").notNull(),
    description: text("description"),
    // File storage reference (e.g. S3 key, object URL)
    fileUrl: text("file_url").notNull(),
    fileName: text("file_name").notNull(),
    fileMimeType: text("file_mime_type").notNull(),
    fileSizeBytes: integer("file_size_bytes"),
    // Optional external system reference (e.g. HL7, FHIR resource ID)
    externalId: text("external_id"),
    externalSystem: text("external_system"),
    // Document date (e.g. date the report was issued, may differ from upload)
    documentDate: date("document_date"),
    // Structured metadata for flexible per-type fields (e.g. imaging modality)
    metadata: jsonb("metadata").default({}).$type<Record<string, JsonValue>>(),
    tags: text("tags").array().default([]),
    ...timestamps
  },
  (table) => [
    // Primary access pattern: patient record timeline by type and date
    index("idx_medical_records_patient_type").on(table.patientId, table.recordType),
    index("idx_medical_records_patient_status").on(table.patientId, table.status),
    // Encounter documents sidebar
    index("idx_medical_records_encounter").on(table.encounterId),
    // External system deduplication
    index("idx_medical_records_external").on(table.externalSystem, table.externalId),
    index("idx_medical_records_uploaded_by").on(table.uploadedBy)
  ]
);
