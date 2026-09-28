// queries/admin.ts
import { count, eq, sum } from "drizzle-orm";

import { db } from "#@/index";
import { user } from "#@/schema/auth";
import { invoices, payments } from "#@/schema/billing";
import { auditLogs, clinicSettings } from "#@/schema/clinic";
import { appointments } from "#@/schema/clinical";
import { type Role } from "#@/schema/common";
import { admissions } from "#@/schema/inpatient";
import { patients } from "#@/schema/patients";

// ============================================================================
// USERS
// ============================================================================

export async function findUsers() {
  return await db.query.user.findMany({
    columns: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true, // ✅ now on user directly
      status: true,
      banned: true, // ✅ Better Auth admin plugin
      lastLoginAt: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function findUserById(id: string) {
  return await db.query.user.findFirst({
    where: { id },
    with: {
      staffProfile: true,
      patientProfile: true
    }
    // NOTE: role lives on user.role — no join needed
  });
}

export async function findUsersByRole(role: Role) {
  return await db.query.user.findMany({
    where: { role },
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      banned: true
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function updateUserStatus(id: string, status: (typeof user.$inferSelect)["status"]) {
  const [updated] = await db
    .update(user)
    .set({ status, updatedAt: new Date() })
    .where(eq(user.id, id))
    .returning();
  return updated ?? null;
}

export async function countUsersByStatus() {
  // ✅ Use SQL aggregation — no need to fetch all users
  const rows = await db
    .select({
      status: user.status,
      count: count()
    })
    .from(user)
    .groupBy(user.status);

  const grouped: Record<string, number> = {};
  for (const row of rows) {
    grouped[row.status] = Number(row.count);
  }
  return grouped;
}

export async function countUsersByRole() {
  const rows = await db
    .select({
      role: user.role,
      count: count()
    })
    .from(user)
    .groupBy(user.role);

  const grouped: Record<string, number> = {};
  for (const row of rows) {
    if (row.role) grouped[row.role] = Number(row.count);
  }
  return grouped;
}

// ============================================================================
// HOSPITAL SETTINGS
// ============================================================================

export async function findHospitalSettings() {
  return await db.query.clinicSettings.findFirst();
}

export async function updateHospitalSettings(
  id: string,
  data: Partial<typeof clinicSettings.$inferInsert>
) {
  const [updated] = await db
    .update(clinicSettings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(clinicSettings.id, id))
    .returning();
  return updated ?? null;
}

// ============================================================================
// AUDIT LOGS
// ============================================================================

export async function findAuditLogs() {
  return await db.query.auditLogs.findMany({
    columns: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      metadata: true,
      createdAt: true,
      actorUserId: true
    },
    with: {
      actor: {
        columns: { id: true, name: true, email: true }
      }
    },
    orderBy: { createdAt: "desc" },
    limit: 100
  });
}

export async function findRecentAuditLogs(limit = 50) {
  return await db.query.auditLogs.findMany({
    with: {
      actor: { columns: { id: true, name: true, email: true } }
    },
    orderBy: { createdAt: "desc" },
    limit
  });
}

export async function findAuditLogById(id: string) {
  return await db.query.auditLogs.findFirst({
    where: { id },
    with: {
      actor: { columns: { id: true, name: true, email: true } }
    }
  });
}

export async function findAuditLogsByEntity(entityType: string, entityId: string) {
  return await db.query.auditLogs.findMany({
    where: { entityType, entityId },
    with: {
      actor: { columns: { id: true, name: true, email: true } }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function findAuditLogsByActor(actorUserId: string, limit = 100) {
  return await db.query.auditLogs.findMany({
    where: { actorUserId },
    with: {
      actor: { columns: { id: true, name: true, email: true } }
    },
    orderBy: { createdAt: "desc" },
    limit
  });
}

export async function findAuditLogsByAction(action: string) {
  return await db.query.auditLogs.findMany({
    where: { action },
    with: {
      actor: { columns: { id: true, name: true, email: true } }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function findAuditLogsByDateRange(from: Date, to: Date) {
  return await db.query.auditLogs.findMany({
    where: { createdAt: { gte: from, lte: to } },
    with: {
      actor: { columns: { id: true, name: true, email: true } }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function insertAuditLog(data: typeof auditLogs.$inferInsert) {
  const [log] = await db.insert(auditLogs).values(data).returning();
  return log ?? null;
}

// ============================================================================
// OPERATIONAL SUMMARY
// ============================================================================

export async function getOperationalSummary() {
  const [
    patientCountResult,
    appointmentCountResult,
    admissionCountResult,
    revenueResult,
    paidInvoicesResult
  ] = await Promise.all([
    db.select({ count: count() }).from(patients),
    db.select({ count: count() }).from(appointments),
    db.select({ count: count() }).from(admissions),
    db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(eq(payments.status, "completed")),
    db
      .select({ total: sum(invoices.grandTotal) })
      .from(invoices)
      .where(eq(invoices.status, "paid"))
  ]);

  return {
    totalPatients: Number(patientCountResult[0]?.count ?? 0),
    totalAppointments: Number(appointmentCountResult[0]?.count ?? 0),
    totalAdmissions: Number(admissionCountResult[0]?.count ?? 0),
    totalCollectedRevenue: Number(revenueResult[0]?.total ?? 0),
    totalBilledRevenue: Number(paidInvoicesResult[0]?.total ?? 0)
  };
}
