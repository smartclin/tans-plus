// src/db/seeds/helpers.ts
import { type InferInsertModel, sql } from "drizzle-orm";
import postgres from "postgres";

import { ENV_SERVER } from "@tans/env/server/env";
import { LOG_SERVICES, createLogger, initLogger } from "@tans/logger/server";

import { db } from "#@/index";
import {
  type account,
  type invitation,
  type member,
  type organization,
  type session,
  type user,
  type userAdmin,
  type verification
} from "#@/schema/auth";
import {
  type chargeCatalog,
  type expenses,
  type invoiceItems,
  type invoices,
  type payments
} from "#@/schema/billing";
import {
  type auditLogs,
  type clinicSettings,
  type clinics,
  type departments
} from "#@/schema/clinic";
import {
  type appointments,
  type diagnoses,
  type doctorSchedules,
  type doctors,
  type encounters,
  type growthMeasurements,
  type prescriptionItems,
  type prescriptions,
  type staff
} from "#@/schema/clinical";
import {
  type immunizations,
  type medicalRecords,
  type whoGrowthData
} from "#@/schema/immunization";
import {
  type admissions,
  type bedAllocations,
  type beds,
  type clinicalNotes,
  type dispensationItems,
  type dispensations,
  type guardians,
  type inventoryTransactions,
  type labOrderItems,
  type labOrders,
  type labTests,
  type medicineBatches,
  type medicines,
  type patientAllergies,
  type patientChronicConditions,
  type patientDocuments,
  type patients,
  type rooms,
  type wards
} from "#@/schema/index";

// Initialize logging once for the seed process
initLogger({
  env: {
    environment: ENV_SERVER.NODE_ENV,
    service: LOG_SERVICES.SERVER
  },
  redact: {
    paths: ["password", "passwordHash", "pinHash", "token", "secret"]
  }
});

const client = postgres(ENV_SERVER.DATABASE_URL, { max: 10 });

export const seedDb = db;

// ─── Wide-event logger factory ────────────────────────────────
export function seedLogger(operation: string) {
  return createLogger({ operation, origin: "seed" });
}

export async function closePool() {
  await client.end();
}

export async function truncateAll() {
  const logger = seedLogger("truncate_all");
  logger.set({ tables: 40 });
  await seedDb.execute(sql`
    TRUNCATE TABLE
      audit_logs, expenses, payments, invoice_items, invoices,
      dispensation_items, dispensations, inventory_transactions, medicine_batches, medicines,
      lab_order_items, lab_orders, lab_tests,
      clinical_notes, bed_allocations, admissions, beds, rooms, wards,
      growth_measurements, immunizations,
      prescription_items, prescriptions, diagnoses, encounters, appointments,
      patient_chronic_conditions, patient_allergies, patient_documents, guardians, patients,
      doctor_schedules, doctors, staff, departments,
      clinic_settings, clinics,
      invitation, member, organization, user_admin,
      account, session, verification, user
    RESTART IDENTITY CASCADE
  `);
  logger.emit({ event: "truncate_complete" });
}

// ─── ID generators ────────────────────────────────────────────
export const ids = {
  mrn: (i: number) => `MRN-${String(i).padStart(6, "0")}`,
  doctorCode: (i: number) => `DOC-${String(i).padStart(4, "0")}`,
  appointmentNumber: (i: number) => `APT-${String(i).padStart(6, "0")}`,
  encounterNumber: (i: number) => `ENC-${String(i).padStart(6, "0")}`,
  admissionNumber: (i: number) => `ADM-${String(i).padStart(6, "0")}`,
  prescriptionNumber: (i: number) => `RX-${String(i).padStart(6, "0")}`,
  labOrderNumber: (i: number) => `LAB-${String(i).padStart(6, "0")}`,
  invoiceNumber: (i: number) => `INV-${String(i).padStart(6, "0")}`,
  paymentNumber: (i: number) => `PAY-${String(i).padStart(6, "0")}`,
  expenseNumber: (i: number) => `EXP-${String(i).padStart(6, "0")}`,
  registrationNumber: (i: number) => `REG-${String(i).padStart(6, "0")}`,
  departmentCode: (i: number) => `DEPT-${String(i).padStart(3, "0")}`,
  wardCode: (i: number) => `WARD-${String(i).padStart(3, "0")}`,
  medicineCode: (i: number) => `MED-${String(i).padStart(5, "0")}`,
  labTestCode: (i: number) => `LABT-${String(i).padStart(4, "0")}`,
  chargeCode: (i: number) => `CHG-${String(i).padStart(4, "0")}`
};

// ─── Pick helpers ─────────────────────────────────────────────
export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].toSorted(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randFloat(min: number, max: number, decimals = 2): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

export const dateStr = (d: Date) => d.toISOString().slice(0, 10);

export function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

export function approximateWeight(ageMonths: number): number {
  // Rough pediatric averages
  if (ageMonths <= 12) return randFloat(3.2 + ageMonths * 0.65, 4.5 + ageMonths * 0.75, 2);
  if (ageMonths <= 60) {
    return randFloat(10 + (ageMonths - 12) * 0.28, 13 + (ageMonths - 12) * 0.33, 2);
  }
  return randFloat(20 + (ageMonths - 60) * 0.35, 25 + (ageMonths - 60) * 0.42, 2);
}

export function approximateHeight(ageMonths: number): number {
  if (ageMonths <= 12) return randFloat(50 + ageMonths * 2.1, 54 + ageMonths * 2.3, 1);
  if (ageMonths <= 60) {
    return randFloat(75 + (ageMonths - 12) * 0.85, 80 + (ageMonths - 12) * 0.9, 1);
  }
  return randFloat(115 + (ageMonths - 60) * 0.55, 125 + (ageMonths - 60) * 0.6, 1);
}

export function approximateHeadCirc(ageMonths: number): number {
  if (ageMonths <= 3) return randFloat(34, 40, 1);
  if (ageMonths <= 12) return randFloat(40, 47, 1);
  return randFloat(47, 52, 1);
}

export function monthsBetween(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}
export function encounterNumber(n: number, prefix = "ENC"): string {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(n).padStart(5, "0")}`;
}

/**
 * Generates a zero-padded prescription number.
 * Format: RX-2025-00001
 */
export function prescriptionNumber(n: number, prefix = "RX"): string {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(n).padStart(5, "0")}`;
}

/**
 * Generic padded sequence generator — useful for:
 * appointmentNumber, admissionNumber, labOrderNumber, invoiceNumber, paymentNumber, expenseNumber
 */
export function sequenceNumber(prefix: string, n: number, pad = 5): string {
  return `${prefix}-${String(n).padStart(pad, "0")}`;
}

// ─── Auth ────────────────────────────────────────────────────
export type UserRow = typeof user.$inferSelect;
export type NewUserRow = typeof user.$inferInsert;
export type SessionRow = typeof session.$inferSelect;
export type NewSessionRow = typeof session.$inferInsert;
export type AccountRow = typeof account.$inferSelect;
export type NewAccountRow = typeof account.$inferInsert;
export type VerificationRow = typeof verification.$inferSelect;
export type NewVerificationRow = typeof verification.$inferInsert;
export type OrganizationRow = typeof organization.$inferSelect;
export type NewOrganizationRow = typeof organization.$inferInsert;
export type MemberRow = typeof member.$inferSelect;
export type NewMemberRow = typeof member.$inferInsert;
export type InvitationRow = typeof invitation.$inferSelect;
export type NewInvitationRow = typeof invitation.$inferInsert;
export type UserAdminRow = typeof userAdmin.$inferSelect;
export type NewUserAdminRow = typeof userAdmin.$inferInsert;

// ─── Clinic ──────────────────────────────────────────────────
export type ClinicRow = typeof clinics.$inferSelect;
export type NewClinicRow = typeof clinics.$inferInsert;
export type ClinicSettingsRow = typeof clinicSettings.$inferSelect;
export type NewClinicSettingsRow = typeof clinicSettings.$inferInsert;
export type DepartmentRow = typeof departments.$inferSelect;
export type NewDepartmentRow = typeof departments.$inferInsert;
export type AuditLogRow = typeof auditLogs.$inferSelect;
export type NewAuditLogRow = typeof auditLogs.$inferInsert;

// ─── Clinical ────────────────────────────────────────────────
export type StaffRow = typeof staff.$inferSelect;
export type NewStaffRow = typeof staff.$inferInsert;
export type DoctorRow = typeof doctors.$inferSelect;
export type NewDoctorRow = typeof doctors.$inferInsert;
export type DoctorScheduleRow = typeof doctorSchedules.$inferSelect;
export type NewDoctorScheduleRow = typeof doctorSchedules.$inferInsert;
export type AppointmentRow = typeof appointments.$inferSelect;
export type NewAppointmentRow = typeof appointments.$inferInsert;
export type EncounterRow = typeof encounters.$inferSelect;
export type NewEncounterRow = typeof encounters.$inferInsert;
export type DiagnosisRow = typeof diagnoses.$inferSelect;
export type NewDiagnosisRow = typeof diagnoses.$inferInsert;
export type PrescriptionRow = typeof prescriptions.$inferSelect;
export type NewPrescriptionRow = typeof prescriptions.$inferInsert;
export type PrescriptionItemRow = typeof prescriptionItems.$inferSelect;
export type NewPrescriptionItemRow = typeof prescriptionItems.$inferInsert;
export type GrowthMeasurementRow = typeof growthMeasurements.$inferSelect;
export type NewGrowthMeasurementRow = typeof growthMeasurements.$inferInsert;

// ─── Patients ────────────────────────────────────────────────
export type PatientRow = typeof patients.$inferSelect;
export type NewPatientRow = typeof patients.$inferInsert;
export type PatientDocumentRow = typeof patientDocuments.$inferSelect;
export type NewPatientDocumentRow = typeof patientDocuments.$inferInsert;
export type GuardianRow = typeof guardians.$inferSelect;
export type NewGuardianRow = typeof guardians.$inferInsert;
export type PatientAllergyRow = typeof patientAllergies.$inferSelect;
export type NewPatientAllergyRow = typeof patientAllergies.$inferInsert;
export type PatientChronicConditionRow = typeof patientChronicConditions.$inferSelect;
export type NewPatientChronicConditionRow = typeof patientChronicConditions.$inferInsert;

// ─── Immunization ────────────────────────────────────────────
export type ImmunizationRow = typeof immunizations.$inferSelect;
export type NewImmunizationRow = typeof immunizations.$inferInsert;
export type WhoGrowthDataRow = typeof whoGrowthData.$inferSelect;
export type NewWhoGrowthDataRow = typeof whoGrowthData.$inferInsert;
export type MedicalRecordRow = typeof medicalRecords.$inferSelect;
export type NewMedicalRecordRow = typeof medicalRecords.$inferInsert;

// ─── Inpatient ───────────────────────────────────────────────
export type WardRow = typeof wards.$inferSelect;
export type NewWardRow = typeof wards.$inferInsert;
export type RoomRow = typeof rooms.$inferSelect;
export type NewRoomRow = typeof rooms.$inferInsert;
export type BedRow = typeof beds.$inferSelect;
export type NewBedRow = typeof beds.$inferInsert;
export type AdmissionRow = typeof admissions.$inferSelect;
export type NewAdmissionRow = typeof admissions.$inferInsert;
export type BedAllocationRow = typeof bedAllocations.$inferSelect;
export type NewBedAllocationRow = typeof bedAllocations.$inferInsert;
export type ClinicalNoteRow = typeof clinicalNotes.$inferSelect;
export type NewClinicalNoteRow = typeof clinicalNotes.$inferInsert;

// ─── Laboratory ──────────────────────────────────────────────
export type LabTestRow = typeof labTests.$inferSelect;
export type NewLabTestRow = typeof labTests.$inferInsert;
export type LabOrderRow = typeof labOrders.$inferSelect;
export type NewLabOrderRow = typeof labOrders.$inferInsert;
export type LabOrderItemRow = typeof labOrderItems.$inferSelect;
export type NewLabOrderItemRow = typeof labOrderItems.$inferInsert;

// ─── Billing ─────────────────────────────────────────────────
export type ChargeCatalogRow = typeof chargeCatalog.$inferSelect;
export type NewChargeCatalogRow = typeof chargeCatalog.$inferInsert;
export type InvoiceRow = typeof invoices.$inferSelect;
export type NewInvoiceRow = typeof invoices.$inferInsert;
export type InvoiceItemRow = typeof invoiceItems.$inferSelect;
export type NewInvoiceItemRow = InferInsertModel<typeof invoiceItems>;
export type PaymentRow = typeof payments.$inferSelect;
export type NewPaymentRow = typeof payments.$inferInsert;
export type ExpenseRow = typeof expenses.$inferSelect;
export type NewExpenseRow = typeof expenses.$inferInsert;

// ─── Pharmacy ────────────────────────────────────────────────
export type MedicineRow = typeof medicines.$inferSelect;
export type NewMedicineRow = typeof medicines.$inferInsert;
export type MedicineBatchRow = typeof medicineBatches.$inferSelect;
export type NewMedicineBatchRow = typeof medicineBatches.$inferInsert;
export type InventoryTransactionRow = typeof inventoryTransactions.$inferSelect;
export type NewInventoryTransactionRow = typeof inventoryTransactions.$inferInsert;
export type DispensationRow = typeof dispensations.$inferSelect;
export type NewDispensationRow = typeof dispensations.$inferInsert;
export type DispensationItemRow = typeof dispensationItems.$inferSelect;
export type NewDispensationItemRow = typeof dispensationItems.$inferInsert;

// ─── Aggregate aliases (commonly used together) ──────────────
export type NewWhoRow = NewWhoGrowthDataRow;
export type ExcelRow = NewWhoRow; // alias used by seed-who.ts
