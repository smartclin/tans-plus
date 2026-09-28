// queries/patients.ts
import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";

import { db } from "#@/index";
import {
  guardians,
  patientAllergies,
  patientChronicConditions,
  patientDocuments,
  patients
} from "#@/schema/patients";
import { type PatientListQuery } from "#@/validations/patient";

// ─────────────────────────────────────────────────────────────
// Filter builder — shared between data query and count query
// ─────────────────────────────────────────────────────────────
function buildPatientFilters(params: PatientListQuery) {
  const { search, gender } = params;
  const conditions = [];

  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(patients.firstName, term),
        ilike(patients.lastName, term),
        ilike(patients.mrn, term),
        ilike(patients.phone, term)
      )
    );
  }

  if (gender) {
    conditions.push(eq(patients.gender, gender));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

// ─────────────────────────────────────────────────────────────
// Sort builder — maps validated `sort` keys to schema columns.
// RQB's `orderBy` object can't express a dynamic column map, so we
// stay on `db.select()` for the list query.
// ─────────────────────────────────────────────────────────────
const SORT_COLUMNS = {
  createdAt: patients.createdAt,
  firstName: patients.firstName,
  lastName: patients.lastName,
  mrn: patients.mrn
} as const;

function buildPatientOrderBy(params: PatientListQuery) {
  const { sort, order } = params;
  const column = SORT_COLUMNS[sort] ?? patients.createdAt;
  return order === "asc" ? asc(column) : desc(column);
}

// ─────────────────────────────────────────────────────────────
// findPatients — paginated list with search + filter + sort
// Kept on db.select().from() because:
//   1. Dynamic ORDER BY column map can't be expressed in RQB
//   2. The count(*) aggregation needs a raw SQL builder
// ─────────────────────────────────────────────────────────────
export async function findPatients(params: PatientListQuery) {
  const { page, pageSize } = params;
  const offset = (page - 1) * pageSize;

  const whereClause = buildPatientFilters(params);
  const orderByClause = buildPatientOrderBy(params);

  const [data, totalCountResult] = await Promise.all([
    db
      .select({
        id: patients.id,
        mrn: patients.mrn,
        firstName: patients.firstName,
        lastName: patients.lastName,
        dateOfBirth: patients.dateOfBirth,
        gender: patients.gender,
        bloodGroup: patients.bloodGroup,
        phone: patients.phone,
        email: patients.email,
        city: patients.city,
        state: patients.state,
        activeStatus: patients.activeStatus,
        pediatricianId: patients.pediatricianId,
        clinicId: patients.clinicId,
        createdAt: patients.createdAt,
        updatedAt: patients.updatedAt
      })
      .from(patients)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(patients).where(whereClause)
  ]);

  const total = Number(totalCountResult[0]?.count ?? 0);

  return {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
}

// ─────────────────────────────────────────────────────────────
// findPatientById — simple PK lookup → RQB findFirst
// ─────────────────────────────────────────────────────────────
export async function findPatientById(id: string) {
  return (
    (await db.query.patients.findFirst({
      where: { id },
      with: {
        guardians: {
          orderBy: { isPrimary: "desc" }
        },
        activeAllergies: true,
        activeConditions: true
      }
    })) ?? null
  );
}

// ─────────────────────────────────────────────────────────────
// findPatientByNumber — `patientNumber` was never a real column.
// The MRN *is* the patient number. Renamed param + column to `mrn`.
// ─────────────────────────────────────────────────────────────
export async function findPatientByMrn(mrn: string) {
  return (
    (await db.query.patients.findFirst({
      where: { mrn }
    })) ?? null
  );
}

/** @deprecated Use `findPatientByMrn` — `patientNumber` is not a schema column. */
export const findPatientByNumber = findPatientByMrn;

// ─────────────────────────────────────────────────────────────
// insertPatient — unchanged (values()/returning() are v2-safe)
// ─────────────────────────────────────────────────────────────
export async function insertPatient(data: typeof patients.$inferInsert) {
  const [newPatient] = await db.insert(patients).values(data).returning();
  return newPatient ?? null;
}

// ─────────────────────────────────────────────────────────────
// updatePatientById — unchanged (set()/where()/returning() are v2-safe)
// ─────────────────────────────────────────────────────────────
export async function updatePatientById(id: string, data: Partial<typeof patients.$inferInsert>) {
  const [updated] = await db
    .update(patients)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(patients.id, id))
    .returning();
  return updated ?? null;
}
// Add after updatePatientById (line ~157)

export async function findPatientWithDetails(id: string) {
  return await db.query.patients.findFirst({
    where: { id },
    with: {
      user: { columns: { id: true, name: true, email: true } },
      pediatrician: {
        columns: { id: true, name: true, email: true, phone: true }
      },
      clinic: { columns: { id: true, name: true } },
      guardians: { orderBy: { isPrimary: "desc" } },
      activeAllergies: true,
      activeConditions: true,
      activePrescriptions: { with: { items: true } },
      appointments: {
        columns: {
          id: true,
          appointmentNumber: true,
          scheduledStart: true,
          status: true
        },
        orderBy: { scheduledStart: "desc" },
        limit: 10
      },
      encounters: {
        columns: {
          id: true,
          encounterNumber: true,
          status: true,
          startedAt: true
        },
        orderBy: { startedAt: "desc" },
        limit: 10
      }
    }
  });
}

export async function findPatientAllergies(patientId: string) {
  return await db.query.patientAllergies.findMany({
    where: { patientId },
    orderBy: { identifiedDate: "desc" }
  });
}

export async function findPatientChronicConditions(patientId: string) {
  return await db.query.patientChronicConditions.findMany({
    where: { patientId },
    orderBy: { diagnosedDate: "desc" }
  });
}

export async function findPatientGuardians(patientId: string) {
  return await db.query.guardians.findMany({
    where: { patientId },
    orderBy: { isPrimary: "desc" }
  });
}

export async function insertGuardian(
  patientId: string,
  data: {
    name: string;
    relationship:
      | "Mother"
      | "Father"
      | "Grandparent"
      | "Legal Guardian"
      | "Foster Parent"
      | "Other";
    phone: string;
    email?: string;
    address?: string;
    isPrimary?: boolean;
    emergencyContact?: boolean;
    contactOrder?: number;
    notes?: string;
  }
) {
  const [guardian] = await db
    .insert(guardians)
    .values({ patientId, ...data })
    .returning();
  return guardian ?? null;
}

export async function insertPatientAllergy(
  patientId: string,
  data: {
    allergen: string;
    category: "Medication" | "Food" | "Environmental" | "Other";
    severity: "Mild" | "Moderate" | "Severe" | "Anaphylactic";
    status?: "Active" | "Resolved" | "Inactive";
    reaction: string;
    identifiedDate?: string;
    onsetDate?: string;
    resolutionDate?: string;
    notes?: string;
  }
) {
  const [allergy] = await db
    .insert(patientAllergies)
    .values({ patientId, ...data })
    .returning();
  return allergy ?? null;
}

export async function insertPatientChronicCondition(
  patientId: string,
  data: {
    condition: string;
    icdCode?: string;
    diagnosedDate: string;
    status?: "Active" | "Resolved" | "In Remission";
    severity?: "Mild" | "Moderate" | "Severe";
    notes?: string;
  }
) {
  const [condition] = await db
    .insert(patientChronicConditions)
    .values({ patientId, ...data })
    .returning();
  return condition ?? null;
}
export async function findPatientByUserId(userId: string) {
  return await db.query.patients.findFirst({
    where: { userId }
  });
}

export async function findPatientsByPediatrician(pediatricianId: string) {
  return await db.query.patients.findMany({
    where: { pediatricianId, activeStatus: "active" },
    columns: {
      id: true,
      mrn: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      gender: true,
      phone: true
    },
    orderBy: { lastName: "asc" }
  });
}

export async function findPatientsByClinic(clinicId: string) {
  return await db.query.patients.findMany({
    where: { clinicId, activeStatus: "active" },
    orderBy: { lastName: "asc" }
  });
}

export async function findPatientDocuments(patientId: string) {
  return await db.query.patientDocuments.findMany({
    where: { patientId },
    with: { uploader: { columns: { id: true, name: true } } },
    orderBy: { createdAt: "desc" }
  });
}

export async function insertPatientDocument(data: typeof patientDocuments.$inferInsert) {
  const [row] = await db.insert(patientDocuments).values(data).returning();
  return row ?? null;
}

export async function updateGuardian(id: string, data: Partial<typeof guardians.$inferInsert>) {
  const [updated] = await db
    .update(guardians)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(guardians.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteGuardian(id: string) {
  const [deleted] = await db.delete(guardians).where(eq(guardians.id, id)).returning();
  return deleted ?? null;
}

export async function updatePatientAllergy(
  id: string,
  data: Partial<typeof patientAllergies.$inferInsert>
) {
  const [updated] = await db
    .update(patientAllergies)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(patientAllergies.id, id))
    .returning();
  return updated ?? null;
}

export async function updatePatientChronicCondition(
  id: string,
  data: Partial<typeof patientChronicConditions.$inferInsert>
) {
  const [updated] = await db
    .update(patientChronicConditions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(patientChronicConditions.id, id))
    .returning();
  return updated ?? null;
}

export async function countPatientsByStatus() {
  return await db
    .select({
      activeStatus: patients.activeStatus,
      count: count()
    })
    .from(patients)
    .groupBy(patients.activeStatus);
}
// queries/patients.ts — ADD AFTER insertPatientChronicCondition

export async function findPatientAllergyById(id: string) {
  return await db.query.patientAllergies.findFirst({
    where: { id },
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true, mrn: true } }
    }
  });
}

export async function deletePatientAllergy(id: string) {
  const [deleted] = await db
    .delete(patientAllergies)
    .where(eq(patientAllergies.id, id))
    .returning();
  return deleted ?? null;
}

export async function findPatientChronicConditionById(id: string) {
  return await db.query.patientChronicConditions.findFirst({
    where: { id },
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true, mrn: true } }
    }
  });
}

export async function deletePatientChronicCondition(id: string) {
  const [deleted] = await db
    .delete(patientChronicConditions)
    .where(eq(patientChronicConditions.id, id))
    .returning();
  return deleted ?? null;
}

export async function findGuardianById(id: string) {
  return await db.query.guardians.findFirst({
    where: { id },
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true, mrn: true } },
      user: { columns: { id: true, name: true, email: true } }
    }
  });
}

export async function findPatientDocumentById(id: string) {
  return await db.query.patientDocuments.findFirst({
    where: { id },
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true, mrn: true } },
      uploader: { columns: { id: true, name: true } }
    }
  });
}

export async function deletePatientDocument(id: string) {
  const [deleted] = await db
    .delete(patientDocuments)
    .where(eq(patientDocuments.id, id))
    .returning();
  return deleted ?? null;
}

export async function findActivePatientAllergies(patientId: string) {
  return await db.query.patientAllergies.findMany({
    where: { patientId, status: "Active" },
    orderBy: { severity: "desc" }
  });
}

export async function findActivePatientConditions(patientId: string) {
  return await db.query.patientChronicConditions.findMany({
    where: { patientId, status: "Active" },
    orderBy: { diagnosedDate: "desc" }
  });
}

export async function findPrimaryGuardian(patientId: string) {
  return await db.query.guardians.findFirst({
    where: { patientId, isPrimary: true },
    orderBy: { contactOrder: "asc" }
  });
}

export async function searchPatientsByMrn(mrn: string) {
  return await db.query.patients.findMany({
    where: { mrn: { ilike: `%${mrn}%` } },
    columns: { id: true, mrn: true, firstName: true, lastName: true, dateOfBirth: true },
    limit: 20
  });
}

export async function countPatientsByGender() {
  return await db
    .select({ gender: patients.gender, count: count() })
    .from(patients)
    .groupBy(patients.gender);
}

export async function countPatientsByClinic(clinicId: string) {
  return await db.select({ count: count() }).from(patients).where(eq(patients.clinicId, clinicId));
}
