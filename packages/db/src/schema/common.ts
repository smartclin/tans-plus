// schema/common.ts
import { pgEnum } from "drizzle-orm/pg-core";

// ============================================================
// CONST ARRAYS — Single source of truth for every vocabulary
// ============================================================

// ─── Identity / Demographics ────────────────────────────────
export const GENDERS = ["male", "female", "other"] as const;

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"] as const;

export const DELIVERY_METHODS = ["Vaginal", "Cesarean", "Assisted"] as const;

export const GUARDIAN_RELATIONSHIPS = [
  "Mother",
  "Father",
  "Grandparent",
  "Legal Guardian",
  "Foster Parent",
  "Other"
] as const;

export const PREFERRED_LANGUAGES = ["English", "Arabic", "French", "Spanish", "Other"] as const;

// ─── Auth / RBAC ────────────────────────────────────────────
export const USER_STATUSES = ["active", "inactive", "suspended"] as const;

export const ROLES = [
  "admin",
  "doctor",
  "staff",
  "patient",
  "nurse",
  "pharmacist",
  "labTech",
  "receptionist",
  "accountant"
] as const;

/** Staff table should never hold "patient" role. */
export const STAFF_ROLES = ["admin", "doctor", "staff"] as const;

export const ACTIVE_STATUSES = ["active", "inactive", "suspended", "archived"] as const;

// ─── Appointments / Encounters ──────────────────────────────
export const APPOINTMENT_STATUSES = [
  "scheduled",
  "checked_in",
  "in_progress",
  "completed",
  "cancelled",
  "no_show"
] as const;

export const APPOINTMENT_PRIORITIES = ["Normal", "Urgent", "Emergency"] as const;

export const VISIT_TYPES = [
  "Well-Child Check",
  "Sick Visit",
  "Follow-Up",
  "Immunization Visit",
  "Consultation",
  "Lactation Consultation",
  "Emergency/Urgent",
  "Telehealth",
  "Other"
] as const;

export const ENCOUNTER_STATUSES = ["in_progress", "completed", "cancelled"] as const;

export const TEMPERATURE_METHODS = ["Axillary", "Oral", "Rectal", "Tympanic", "Temporal"] as const;

export const PAIN_SCALE_TYPES = ["Wong-Baker", "Numeric", "FLACC", "Neonatal"] as const;

// ─── Prescriptions ──────────────────────────────────────────
export const PRESCRIPTION_STATUSES = ["active", "completed", "cancelled"] as const;

// ─── Immunization ───────────────────────────────────────────
export const IMMUNIZATION_STATUSES = [
  "Administered",
  "Due",
  "Overdue",
  "Upcoming",
  "Deferred",
  "Refused"
] as const;

// ─── Growth / Metrics ───────────────────────────────────────
export const METRIC_TYPES = ["weight", "height", "head_circumference", "bmi"] as const;

// ─── Patient Clinical Flags ─────────────────────────────────
export const ALLERGY_CATEGORIES = ["Medication", "Food", "Environmental", "Other"] as const;

export const ALLERGY_SEVERITIES = ["Mild", "Moderate", "Severe", "Anaphylactic"] as const;

export const ALLERGY_STATUSES = ["Active", "Resolved", "Inactive"] as const;

export const CONDITION_STATUSES = ["Active", "Resolved", "In Remission"] as const;

export const CONDITION_SEVERITIES = ["Mild", "Moderate", "Severe"] as const;

// ─── Laboratory ─────────────────────────────────────────────
export const LAB_ORDER_STATUSES = [
  "ordered",
  "collected",
  "processing",
  "completed",
  "cancelled"
] as const;

export const LAB_PRIORITIES = ["Routine", "Urgent", "Stat"] as const;

export const LAB_TEST_FLAGS = ["Normal", "Abnormal", "Critical"] as const;

// ─── Inpatient ──────────────────────────────────────────────
export const ADMISSION_STATUSES = ["admitted", "discharged", "cancelled"] as const;

export const BED_STATUSES = ["available", "occupied", "maintenance"] as const;

export const WARD_TYPES = ["Pediatric", "NICU", "PICU", "General", "Isolation"] as const;

export const ROOM_TYPES = ["Private", "Semi-Private", "Ward", "Isolation"] as const;

export const CLINICAL_NOTE_TYPES = [
  "Progress",
  "Admission",
  "Discharge",
  "Consultation",
  "Nursing",
  "Procedure",
  "Other"
] as const;

// ─── Billing ────────────────────────────────────────────────
export const INVOICE_STATUSES = ["draft", "issued", "partially_paid", "paid", "void"] as const;

export const PAYMENT_STATUSES = ["pending", "completed", "failed", "refunded"] as const;

export const PAYMENT_METHODS = ["cash", "card", "bank_transfer", "insurance", "other"] as const;

// ─── Pharmacy / Inventory ───────────────────────────────────
export const INVENTORY_TRANSACTION_TYPES = ["receive", "dispense", "adjustment", "return"] as const;

// ─── Documents ──────────────────────────────────────────────
export const DOCUMENT_TYPES = ["id_proof", "lab_report", "prescription", "other"] as const;

export const MEDICAL_RECORD_TYPES = [
  "Lab Report",
  "Imaging",
  "Referral",
  "Discharge Summary",
  "Consent Form",
  "Insurance",
  "Operative Report",
  "Pathology",
  "External Record",
  "Other"
] as const;

export const MEDICAL_RECORD_STATUSES = ["Active", "Archived", "Superseded"] as const;

// ─── Audit ──────────────────────────────────────────────────
export const AUDIT_ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "VIEW",
  "EXPORT",
  "LOGIN",
  "RESTORE"
] as const;

export const AUDIT_ENTITIES = [
  "PATIENT",
  "ENCOUNTER",
  "IMMUNIZATION",
  "PRESCRIPTION",
  "LAB",
  "INVOICE",
  "PAYMENT",
  "ADMISSION",
  "USER",
  "DATABASE"
] as const;

// ============================================================
// PG ENUMS — derived from the const arrays above
// ============================================================

// Identity / Demographics
export const genderEnum = pgEnum("gender", GENDERS);
export const bloodGroupEnum = pgEnum("blood_group", BLOOD_GROUPS);
export const deliveryMethodEnum = pgEnum("delivery_method", DELIVERY_METHODS);
export const guardianRelationshipEnum = pgEnum("guardian_relationship", GUARDIAN_RELATIONSHIPS);

// Auth / RBAC
export const userStatusEnum = pgEnum("user_status", USER_STATUSES);
export const roleEnum = pgEnum("role", ROLES);
export const staffRoleEnum = pgEnum("staff_role", STAFF_ROLES);
export const activeStatusEnum = pgEnum("active_status", ACTIVE_STATUSES);

// Appointments / Encounters
export const appointmentStatusEnum = pgEnum("appointment_status", APPOINTMENT_STATUSES);
export const appointmentPriorityEnum = pgEnum("appointment_priority", APPOINTMENT_PRIORITIES);
export const visitTypeEnum = pgEnum("visit_type", VISIT_TYPES);
export const encounterStatusEnum = pgEnum("encounter_status", ENCOUNTER_STATUSES);
export const temperatureMethodEnum = pgEnum("temperature_method", TEMPERATURE_METHODS);
export const painScaleTypeEnum = pgEnum("pain_scale_type", PAIN_SCALE_TYPES);

// Prescriptions
export const prescriptionStatusEnum = pgEnum("prescription_status", PRESCRIPTION_STATUSES);

// Immunization
export const immunizationStatusEnum = pgEnum("immunization_status", IMMUNIZATION_STATUSES);

// Growth
export const metricTypeEnum = pgEnum("metric_type", METRIC_TYPES);

// Patient clinical flags
export const allergyCategoryEnum = pgEnum("allergy_category", ALLERGY_CATEGORIES);
export const allergySeverityEnum = pgEnum("allergy_severity", ALLERGY_SEVERITIES);
export const allergyStatusEnum = pgEnum("allergy_status", ALLERGY_STATUSES);
export const conditionStatusEnum = pgEnum("condition_status", CONDITION_STATUSES);
export const conditionSeverityEnum = pgEnum("condition_severity", CONDITION_SEVERITIES);

// Laboratory
export const labOrderStatusEnum = pgEnum("lab_order_status", LAB_ORDER_STATUSES);
export const labPriorityEnum = pgEnum("lab_priority", LAB_PRIORITIES);
export const labTestFlagEnum = pgEnum("lab_test_flag", LAB_TEST_FLAGS);

// Inpatient
export const admissionStatusEnum = pgEnum("admission_status", ADMISSION_STATUSES);
export const bedStatusEnum = pgEnum("bed_status", BED_STATUSES);
export const wardTypeEnum = pgEnum("ward_type", WARD_TYPES);
export const roomTypeEnum = pgEnum("room_type", ROOM_TYPES);
export const clinicalNoteTypeEnum = pgEnum("clinical_note_type", CLINICAL_NOTE_TYPES);

// Billing
export const invoiceStatusEnum = pgEnum("invoice_status", INVOICE_STATUSES);
export const paymentStatusEnum = pgEnum("payment_status", PAYMENT_STATUSES);
export const paymentMethodEnum = pgEnum("payment_method", PAYMENT_METHODS);

// Pharmacy / Inventory
export const inventoryTransactionTypeEnum = pgEnum(
  "inventory_transaction_type",
  INVENTORY_TRANSACTION_TYPES
);

// Documents
export const documentTypeEnum = pgEnum("document_type", DOCUMENT_TYPES);
export const medicalRecordTypeEnum = pgEnum("medical_record_type", MEDICAL_RECORD_TYPES);
export const medicalRecordStatusEnum = pgEnum("medical_record_status", MEDICAL_RECORD_STATUSES);

// Audit
export const auditActionEnum = pgEnum("audit_action", AUDIT_ACTIONS);
export const auditEntityEnum = pgEnum("audit_entity", AUDIT_ENTITIES);

// ============================================================
// JSON helper type
// ============================================================
type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export const WHO_GENDERS = ["male", "female"] as const;
export const whoGenderEnum = pgEnum("who_gender", WHO_GENDERS);

// ─── Identity / Demographics ────────────────────────────────
export type Gender = (typeof GENDERS)[number];
export type BloodGroup = (typeof BLOOD_GROUPS)[number];
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];
export type GuardianRelationship = (typeof GUARDIAN_RELATIONSHIPS)[number];
export type PreferredLanguage = (typeof PREFERRED_LANGUAGES)[number];

// ─── Auth / RBAC ────────────────────────────────────────────
export type UserStatus = (typeof USER_STATUSES)[number];
export type Role = (typeof ROLES)[number];
export type StaffRole = (typeof STAFF_ROLES)[number];
export type ActiveStatus = (typeof ACTIVE_STATUSES)[number];

// ─── Appointments / Encounters ──────────────────────────────
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];
export type AppointmentPriority = (typeof APPOINTMENT_PRIORITIES)[number];
export type VisitType = (typeof VISIT_TYPES)[number];
export type EncounterStatus = (typeof ENCOUNTER_STATUSES)[number];
export type TemperatureMethod = (typeof TEMPERATURE_METHODS)[number];
export type PainScaleType = (typeof PAIN_SCALE_TYPES)[number];

// ─── Prescriptions ──────────────────────────────────────────
export type PrescriptionStatus = (typeof PRESCRIPTION_STATUSES)[number];

// ─── Immunization ───────────────────────────────────────────
export type ImmunizationStatus = (typeof IMMUNIZATION_STATUSES)[number];
export type WhoGender = (typeof WHO_GENDERS)[number];

// ─── Growth / Metrics ───────────────────────────────────────
export type MetricType = (typeof METRIC_TYPES)[number];

// ─── Patient Clinical Flags ─────────────────────────────────
export type AllergyCategory = (typeof ALLERGY_CATEGORIES)[number];
export type AllergySeverity = (typeof ALLERGY_SEVERITIES)[number];
export type AllergyStatus = (typeof ALLERGY_STATUSES)[number];
export type ConditionStatus = (typeof CONDITION_STATUSES)[number];
export type ConditionSeverity = (typeof CONDITION_SEVERITIES)[number];

// ─── Laboratory ─────────────────────────────────────────────
export type LabOrderStatus = (typeof LAB_ORDER_STATUSES)[number];
export type LabPriority = (typeof LAB_PRIORITIES)[number];
export type LabTestFlag = (typeof LAB_TEST_FLAGS)[number];

// ─── Inpatient ──────────────────────────────────────────────
export type AdmissionStatus = (typeof ADMISSION_STATUSES)[number];
export type BedStatus = (typeof BED_STATUSES)[number];
export type WardType = (typeof WARD_TYPES)[number];
export type RoomType = (typeof ROOM_TYPES)[number];
export type ClinicalNoteType = (typeof CLINICAL_NOTE_TYPES)[number];

// ─── Billing ────────────────────────────────────────────────
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// ─── Pharmacy / Inventory ───────────────────────────────────
export type InventoryTransactionType = (typeof INVENTORY_TRANSACTION_TYPES)[number];

// ─── Documents ──────────────────────────────────────────────
export type DocumentType = (typeof DOCUMENT_TYPES)[number];
export type MedicalRecordType = (typeof MEDICAL_RECORD_TYPES)[number];
export type MedicalRecordStatus = (typeof MEDICAL_RECORD_STATUSES)[number];

// ─── Audit ──────────────────────────────────────────────────
export type AuditAction = (typeof AUDIT_ACTIONS)[number];
export type AuditEntity = (typeof AUDIT_ENTITIES)[number];

// ============================================================
// ZOD-FRIENDLY RE-EXPORTS
// ============================================================
// These are the same const arrays, re-exported with clearer names
// so validations/*.ts can `z.enum(APPOINTMENT_STATUSES)` etc.
// (Already available as the originals above — listed here for reference.)

export {
  ACTIVE_STATUSES as ActiveStatusValues,
  ADMISSION_STATUSES as AdmissionStatusValues,
  ALLERGY_CATEGORIES as AllergyCategoryValues,
  ALLERGY_SEVERITIES as AllergySeverityValues,
  ALLERGY_STATUSES as AllergyStatusValues,
  APPOINTMENT_PRIORITIES as AppointmentPriorityValues,
  APPOINTMENT_STATUSES as AppointmentStatusValues,
  AUDIT_ACTIONS as AuditActionValues,
  AUDIT_ENTITIES as AuditEntityValues,
  BED_STATUSES as BedStatusValues,
  BLOOD_GROUPS as BloodGroupValues,
  CLINICAL_NOTE_TYPES as ClinicalNoteTypeValues,
  CONDITION_SEVERITIES as ConditionSeverityValues,
  CONDITION_STATUSES as ConditionStatusValues,
  DELIVERY_METHODS as DeliveryMethodValues,
  DOCUMENT_TYPES as DocumentTypeValues,
  ENCOUNTER_STATUSES as EncounterStatusValues,
  GENDERS as GenderValues,
  GUARDIAN_RELATIONSHIPS as GuardianRelationshipValues,
  IMMUNIZATION_STATUSES as ImmunizationStatusValues,
  INVENTORY_TRANSACTION_TYPES as InventoryTransactionTypeValues,
  INVOICE_STATUSES as InvoiceStatusValues,
  LAB_ORDER_STATUSES as LabOrderStatusValues,
  LAB_PRIORITIES as LabPriorityValues,
  LAB_TEST_FLAGS as LabTestFlagValues,
  MEDICAL_RECORD_STATUSES as MedicalRecordStatusValues,
  MEDICAL_RECORD_TYPES as MedicalRecordTypeValues,
  METRIC_TYPES as MetricTypeValues,
  PAIN_SCALE_TYPES as PainScaleTypeValues,
  PAYMENT_METHODS as PaymentMethodValues,
  PAYMENT_STATUSES as PaymentStatusValues,
  PREFERRED_LANGUAGES as PreferredLanguageValues,
  PRESCRIPTION_STATUSES as PrescriptionStatusValues,
  ROLES as RoleValues,
  ROOM_TYPES as RoomTypeValues,
  STAFF_ROLES as StaffRoleValues,
  TEMPERATURE_METHODS as TemperatureMethodValues,
  USER_STATUSES as UserStatusValues,
  VISIT_TYPES as VisitTypeValues,
  WARD_TYPES as WardTypeValues,
  WHO_GENDERS as WhoGenderValues
};
