// queries/patients.ts
import { and, asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";

import { db } from "#@/index";
import { labOrderItems, labOrders, labTests } from "#@/schema/laboratory";
import { patients } from "#@/schema/patients";
import {
  type CreateLabOrderInput,
  type CreateLabTestInput,
  type RecordLabResultInput
} from "#@/validations/laboratory";
import { type PatientListQuery } from "#@/validations/patient";
// ─────────────────────────────────────────────────────────────
// Filter builder — shared by the data query AND the count query,
// so `meta.total` always matches the filtered row set.
// ─────────────────────────────────────────────────────────────
function buildPatientFilters(params: PatientListQuery): SQL | undefined {
  const { search, gender, activeStatus } = params;
  const conditions: SQL[] = [];

  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(patients.firstName, term),
        ilike(patients.lastName, term),
        ilike(patients.mrn, term),
        ilike(patients.phone, term)
      )!
    );
  }

  if (gender) {
    conditions.push(eq(patients.gender, gender));
  }

  if (activeStatus) {
    conditions.push(eq(patients.activeStatus, activeStatus));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

// ─────────────────────────────────────────────────────────────
// Sort map — dynamic ORDER BY can't be expressed via RQB's static
// `orderBy: { col: "asc" }` object, so we stay on the raw builder
// for the list query.
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
// findPatients — paginated list with search, filter, and sort
// ─────────────────────────────────────────────────────────────
export async function findPatients(params: PatientListQuery) {
  const { page, pageSize } = params;
  const offset = (page - 1) * pageSize;

  const whereClause = buildPatientFilters(params);
  const orderByClause = buildPatientOrderBy(params);

  // Both query builders are passed raw to Promise.all — they're
  // thenables, so Promise.all awaits them concurrently.
  // Do NOT pre-await either one or the batching is lost.
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

    // Count query — no ORDER BY, no LIMIT; returns a single row
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
// findPatientById — single-row PK lookup via RQB
// ─────────────────────────────────────────────────────────────
export async function findPatientById(id: string) {
  return await db.query.patients.findFirst({
    where: { id }
  });
}

// ─────────────────────────────────────────────────────────────
// findPatientByNumber — `patientNumber` is NOT a schema column.
// The MRN *is* the patient number; kept the old name as an alias
// so callers don't break during migration.
// ─────────────────────────────────────────────────────────────
export async function findPatientByMrn(mrn: string) {
  return await db.query.patients.findFirst({
    where: { mrn }
  });
}

/** @deprecated Use `findPatientByMrn` — `patientNumber` is not a schema column. */
export const findPatientByNumber = findPatientByMrn;

// ─────────────────────────────────────────────────────────────
// insertPatient — schema-safe insert
// ─────────────────────────────────────────────────────────────
export async function insertPatient(data: typeof patients.$inferInsert) {
  const [newPatient] = await db.insert(patients).values(data).returning();
  return newPatient ?? null;
}

// ─────────────────────────────────────────────────────────────
// updatePatientById — patch + auto-bump updatedAt
// ─────────────────────────────────────────────────────────────
export async function updatePatientById(id: string, data: Partial<typeof patients.$inferInsert>) {
  const [updated] = await db
    .update(patients)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(patients.id, id))
    .returning();
  return updated ?? null;
}
// queries/laboratory.ts — ENTIRE FILE (currently missing/corrupted with patients content)

export async function findLabTests() {
  return await db.query.labTests.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" }
  });
}

export async function findLabTestById(id: string) {
  return await db.query.labTests.findFirst({
    where: { id }
  });
}

export async function findLabOrders() {
  return await db.query.labOrders.findMany({
    columns: {
      id: true,
      labOrderNumber: true,
      status: true,
      orderedAt: true,
      collectedAt: true,
      completedAt: true,
      patientId: true,
      orderedByDoctorId: true
    },
    with: {
      patient: {
        columns: { id: true, firstName: true, lastName: true, mrn: true }
      },
      orderedByDoctor: {
        columns: { id: true, doctorCode: true, specialization: true },
        with: { staff: { columns: { name: true } } }
      },
      items: {
        with: { labTest: true }
      }
    },
    orderBy: { orderedAt: "desc" }
  });
}

export async function findLabOrderById(id: string) {
  return await db.query.labOrders.findFirst({
    where: { id },
    with: {
      patient: {
        columns: { id: true, firstName: true, lastName: true, mrn: true }
      },
      encounter: { columns: { id: true, encounterNumber: true } },
      admission: { columns: { id: true, admissionNumber: true } },
      orderedByDoctor: {
        columns: { id: true, doctorCode: true, specialization: true },
        with: { staff: { columns: { name: true } } }
      },
      items: {
        with: {
          labTest: true,
          resultedByUser: { columns: { id: true, name: true } }
        }
      }
    }
  });
}

export async function findLabOrdersByPatient(patientId: string) {
  return await db.query.labOrders.findMany({
    where: { patientId },
    columns: {
      id: true,
      labOrderNumber: true,
      status: true,
      orderedAt: true,
      completedAt: true
    },
    with: {
      orderedByDoctor: {
        columns: { id: true, doctorCode: true },
        with: { staff: { columns: { name: true } } }
      },
      items: { with: { labTest: true } }
    },
    orderBy: { orderedAt: "desc" }
  });
}

export async function findPendingLabOrders() {
  return await db.query.labOrders.findMany({
    where: { status: { in: ["ordered", "collected", "processing"] } },
    columns: {
      id: true,
      labOrderNumber: true,
      status: true,
      orderedAt: true,
      patientId: true,
      orderedByDoctorId: true
    },
    with: {
      patient: {
        columns: { id: true, firstName: true, lastName: true, mrn: true }
      },
      items: { with: { labTest: true } }
    },
    orderBy: { orderedAt: "asc" }
  });
}

export async function insertLabTest(data: CreateLabTestInput) {
  const [test] = await db
    .insert(labTests)
    .values({ ...data, price: data.price.toString() })
    .returning();
  return test ?? null;
}

export async function insertLabOrderWithItems(data: CreateLabOrderInput, labOrderNumber: string) {
  return await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(labOrders)
      .values({
        labOrderNumber,
        patientId: data.patientId,
        orderedByDoctorId: data.orderedByDoctorId,
        encounterId: data.encounterId ?? null,
        admissionId: data.admissionId ?? null,
        status: "ordered"
      })
      .returning();

    if (!order) throw new Error("Failed to insert lab order");

    const tests = await tx.query.labTests.findMany({
      where: { id: { in: data.testIds } }
    });

    const items = tests.map((t) => {
      return {
        labOrderId: order.id,
        labTestId: t.id,
        testNameSnapshot: t.name,
        priceSnapshot: t.price,
        status: "ordered" as const,
        referenceRangeSnapshot: t.referenceRange,
        unitSnapshot: t.unit
      };
    });

    await tx.insert(labOrderItems).values(items);

    return order;
  });
}

export async function updateLabOrderStatus(
  id: string,
  status: (typeof labOrders.$inferSelect)["status"]
) {
  const [updated] = await db
    .update(labOrders)
    .set({ status, updatedAt: new Date() })
    .where(eq(labOrders.id, id))
    .returning();
  return updated ?? null;
}

export async function recordLabResult(
  itemId: string,
  data: RecordLabResultInput,
  resultedByUserId: string
) {
  const [updated] = await db
    .update(labOrderItems)
    .set({
      resultValue: data.resultValue,
      resultText: data.resultText ?? null,
      status: "completed",
      resultedByUserId,
      resultedAt: new Date()
    })
    .where(eq(labOrderItems.id, itemId))
    .returning();
  return updated ?? null;
}
export async function findLabTestByCode(code: string) {
  return await db.query.labTests.findFirst({
    where: { code }
  });
}

export async function findLabOrdersByDoctor(doctorId: string) {
  return await db.query.labOrders.findMany({
    where: { orderedByDoctorId: doctorId },
    columns: {
      id: true,
      labOrderNumber: true,
      status: true,
      orderedAt: true,
      completedAt: true,
      patientId: true
    },
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true, mrn: true } },
      items: { with: { labTest: true } }
    },
    orderBy: { orderedAt: "desc" }
  });
}

export async function findLabOrdersByEncounter(encounterId: string) {
  return await db.query.labOrders.findMany({
    where: { encounterId },
    with: { items: { with: { labTest: true } } },
    orderBy: { orderedAt: "desc" }
  });
}

export async function findLabOrdersByAdmission(admissionId: string) {
  return await db.query.labOrders.findMany({
    where: { admissionId },
    with: { items: { with: { labTest: true } } },
    orderBy: { orderedAt: "desc" }
  });
}

export async function updateLabOrderItemStatus(
  itemId: string,
  status: (typeof labOrderItems.$inferSelect)["status"]
) {
  const [updated] = await db
    .update(labOrderItems)
    .set({ status })
    .where(eq(labOrderItems.id, itemId))
    .returning();
  return updated ?? null;
}

export async function findLabOrderItemsByOrder(labOrderId: string) {
  return await db.query.labOrderItems.findMany({
    where: { labOrderId },
    with: {
      labTest: true,
      resultedByUser: { columns: { id: true, name: true } }
    }
  });
}
// queries/laboratory.ts — APPEND AT END

export async function updateLabTest(id: string, data: Partial<typeof labTests.$inferInsert>) {
  const [updated] = await db
    .update(labTests)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(labTests.id, id))
    .returning();
  return updated ?? null;
}

export async function deactivateLabTest(id: string) {
  const [updated] = await db
    .update(labTests)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(labTests.id, id))
    .returning();
  return updated ?? null;
}

export async function findLabOrderItemById(id: string) {
  return await db.query.labOrderItems.findFirst({
    where: { id },
    with: {
      labOrder: { columns: { id: true, labOrderNumber: true, patientId: true } },
      labTest: true,
      resultedByUser: { columns: { id: true, name: true } }
    }
  });
}

export async function findLabOrderByNumber(labOrderNumber: string) {
  return await db.query.labOrders.findFirst({
    where: { labOrderNumber },
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true, mrn: true } },
      orderedByDoctor: {
        columns: { id: true, doctorCode: true },
        with: { staff: { columns: { name: true } } }
      },
      items: { with: { labTest: true } }
    }
  });
}

export async function findCompletedLabOrders() {
  return await db.query.labOrders.findMany({
    where: { status: "completed" },
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true, mrn: true } },
      items: { with: { labTest: true } }
    },
    orderBy: { completedAt: "desc" }
  });
}

export async function countLabOrdersByStatus() {
  const rows = await db.query.labOrders.findMany({ columns: { status: true } });
  const grouped: Record<string, number> = {};
  for (const r of rows) grouped[r.status] = (grouped[r.status] ?? 0) + 1;
  return grouped;
}

export async function findLabTestsBySampleType(sampleType: string) {
  return await db.query.labTests.findMany({
    where: { sampleType, isActive: true },
    orderBy: { name: "asc" }
  });
}

export async function findLabTestsByName(name: string) {
  return await db.query.labTests.findMany({
    where: { name: { ilike: `%${name}%` }, isActive: true },
    orderBy: { name: "asc" },
    limit: 20
  });
}
