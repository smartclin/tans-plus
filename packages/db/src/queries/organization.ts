import { asc, eq } from "drizzle-orm";

import { db } from "#@/index";
import { clinics, departments } from "#@/schema/clinic";
import { type CreateDepartmentInput } from "#@/validations/clinical";

export async function findDepartments() {
  return await db.select().from(departments).orderBy(asc(departments.name));
}

export async function findDepartmentById(id: string) {
  const [dept] = await db.select().from(departments).where(eq(departments.id, id)).limit(1);
  return dept || null;
}

export async function insertDepartment(data: CreateDepartmentInput) {
  const [newDept] = await db.insert(departments).values(data).returning();
  return newDept;
}
// Add after insertDepartment (line ~19)

export async function updateDepartment(id: string, data: Partial<CreateDepartmentInput>) {
  const [updated] = await db
    .update(departments)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(departments.id, id))
    .returning();
  return updated ?? null;
}

export async function deactivateDepartment(id: string) {
  const [updated] = await db
    .update(departments)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(departments.id, id))
    .returning();
  return updated ?? null;
}

export async function findActiveDepartments() {
  return await db.query.departments.findMany({
    where: { isActive: true },
    with: { doctors: { columns: { id: true, specialization: true } } },
    orderBy: { name: "asc" }
  });
}
export async function findDepartmentByCode(code: string) {
  return await db.query.departments.findFirst({
    where: { code }
  });
}

export async function findClinics() {
  return await db.query.clinics.findMany({
    orderBy: { name: "asc" }
  });
}

export async function findClinicById(id: string) {
  return await db.query.clinics.findFirst({
    where: { id }
  });
}

export async function insertClinic(data: typeof clinics.$inferInsert) {
  const [row] = await db.insert(clinics).values(data).returning();
  return row ?? null;
}

export async function updateClinic(id: string, data: Partial<typeof clinics.$inferInsert>) {
  const [updated] = await db
    .update(clinics)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(clinics.id, id))
    .returning();
  return updated ?? null;
}
// queries/organization.ts — APPEND AT END

export async function deleteClinic(id: string) {
  const [deleted] = await db.delete(clinics).where(eq(clinics.id, id)).returning();
  return deleted ?? null;
}

export async function deactivateClinic(id: string) {
  const [updated] = await db
    .update(clinics)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(clinics.id, id))
    .returning();
  return updated ?? null;
}

export async function findActiveClinics() {
  return await db.query.clinics.findMany({
    where: { active: true },
    orderBy: { name: "asc" }
  });
}

export async function findClinicByName(name: string) {
  return await db.query.clinics.findFirst({
    where: { name }
  });
}
