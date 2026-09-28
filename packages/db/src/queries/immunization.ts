// queries/immunization.ts
import { count, eq } from "drizzle-orm";

import { db } from "#@/index";
import { immunizations, medicalRecords } from "#@/schema/immunization";

// ─────────────────────────────────────────────────────────────
// Immunizations
// ─────────────────────────────────────────────────────────────
export async function findImmunizationsByPatient(patientId: string) {
  return await db.query.immunizations.findMany({
    where: { patientId },
    orderBy: { dueDate: "asc" }
  });
}

export async function findImmunizationById(id: string) {
  return await db.query.immunizations.findFirst({
    where: { id },
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true, mrn: true } }
    }
  });
}

export async function findDueImmunizations(patientId: string) {
  return await db.query.immunizations.findMany({
    where: { patientId, status: "Due" },
    orderBy: { dueDate: "asc" }
  });
}

export async function findOverdueImmunizations(patientId: string) {
  return await db.query.immunizations.findMany({
    where: { patientId, status: "Overdue" },
    orderBy: { dueDate: "asc" }
  });
}

export async function findAdministeredImmunizations(patientId: string) {
  return await db.query.immunizations.findMany({
    where: { patientId, status: "Administered" },
    orderBy: { administeredDate: "desc" }
  });
}

export async function findImmunizationsByVaccineCode(vaccineCode: string) {
  return await db.query.immunizations.findMany({
    where: { vaccineCode },
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true, mrn: true } }
    },
    orderBy: { administeredDate: "desc" }
  });
}

export async function findImmunizationsByDateRange(from: Date, to: Date) {
  const fromStr = from.toISOString().slice(0, 10);
  const toStr = to.toISOString().slice(0, 10);
  return await db.query.immunizations.findMany({
    where: { dueDate: { gte: fromStr, lte: toStr } },
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true, mrn: true } }
    },
    orderBy: { dueDate: "asc" }
  });
}

export async function insertImmunization(data: typeof immunizations.$inferInsert) {
  const [row] = await db.insert(immunizations).values(data).returning();
  return row ?? null;
}

export async function updateImmunization(
  id: string,
  data: Partial<typeof immunizations.$inferInsert>
) {
  const [updated] = await db
    .update(immunizations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(immunizations.id, id))
    .returning();
  return updated ?? null;
}

export async function markImmunizationAdministered(
  id: string,
  data: {
    administeredDate: string;
    administeredBy: string;
    batchNumber?: string;
    manufacturer?: string;
    administrationSite?: string;
    administrationRoute?: string;
    adverseReactions?: string;
  }
) {
  const [updated] = await db
    .update(immunizations)
    .set({
      ...data,
      status: "Administered",
      updatedAt: new Date()
    })
    .where(eq(immunizations.id, id))
    .returning();
  return updated ?? null;
}

export async function countImmunizationsByStatus(patientId: string) {
  return await db
    .select({ status: immunizations.status, count: count() })
    .from(immunizations)
    .where(eq(immunizations.patientId, patientId))
    .groupBy(immunizations.status);
}

// ─────────────────────────────────────────────────────────────
// WHO Growth Data
// ─────────────────────────────────────────────────────────────
export async function findWhoGrowthData(params: {
  gender: "male" | "female";
  metricType: "weight" | "height" | "head_circumference" | "bmi";
}) {
  return await db.query.whoGrowthData.findMany({
    where: { gender: params.gender, metricType: params.metricType },
    orderBy: { ageMonths: "asc" }
  });
}

export async function findWhoGrowthDataAtAge(params: {
  gender: "male" | "female";
  metricType: "weight" | "height" | "head_circumference" | "bmi";
  ageMonths: number;
}) {
  return await db.query.whoGrowthData.findFirst({
    where: {
      gender: params.gender,
      metricType: params.metricType,
      ageMonths: params.ageMonths
    }
  });
}

// ─────────────────────────────────────────────────────────────
// Medical Records
// ─────────────────────────────────────────────────────────────
export async function findMedicalRecordsByPatient(patientId: string) {
  return await db.query.medicalRecords.findMany({
    where: { patientId },
    with: {
      uploadedByStaff: { columns: { id: true, name: true } },
      encounter: { columns: { id: true, encounterNumber: true } }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function findMedicalRecordById(id: string) {
  return await db.query.medicalRecords.findFirst({
    where: { id },
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true, mrn: true } },
      encounter: { columns: { id: true, encounterNumber: true } },
      uploadedByStaff: { columns: { id: true, name: true } }
    }
  });
}

export async function findMedicalRecordsByEncounter(encounterId: string) {
  return await db.query.medicalRecords.findMany({
    where: { encounterId },
    with: { uploadedByStaff: { columns: { id: true, name: true } } },
    orderBy: { createdAt: "desc" }
  });
}

export async function findMedicalRecordsByType(
  patientId: string,
  recordType: (typeof medicalRecords.$inferSelect)["recordType"]
) {
  return await db.query.medicalRecords.findMany({
    where: { patientId, recordType, status: "Active" },
    orderBy: { documentDate: "desc" }
  });
}

export async function insertMedicalRecord(data: typeof medicalRecords.$inferInsert) {
  const [row] = await db.insert(medicalRecords).values(data).returning();
  return row ?? null;
}

export async function updateMedicalRecord(
  id: string,
  data: Partial<typeof medicalRecords.$inferInsert>
) {
  const [updated] = await db
    .update(medicalRecords)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(medicalRecords.id, id))
    .returning();
  return updated ?? null;
}

export async function archiveMedicalRecord(id: string) {
  const [updated] = await db
    .update(medicalRecords)
    .set({ status: "Archived", updatedAt: new Date() })
    .where(eq(medicalRecords.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteMedicalRecord(id: string) {
  const [deleted] = await db.delete(medicalRecords).where(eq(medicalRecords.id, id)).returning();
  return deleted ?? null;
}
