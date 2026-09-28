import { db, eq } from "#@/index";
import { chargeCatalog, expenses, invoiceItems, invoices, payments } from "#@/schema/billing";

export async function findChargeCatalog() {
  return await db.query.chargeCatalog.findMany();
}

export async function findInvoices() {
  return await db.query.invoices.findMany({
    columns: {
      id: true,
      invoiceNumber: true,
      status: true,
      currencyCode: true,
      subtotal: true,
      discountTotal: true,
      taxTotal: true,
      grandTotal: true,
      amountPaid: true,
      balanceDue: true,
      createdAt: true,
      patientId: true
    },
    with: {
      patient: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          mrn: true,
          phone: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function findInvoiceById(id: string) {
  return await db.query.invoices.findFirst({
    where: { id },
    columns: {
      id: true,
      invoiceNumber: true,
      status: true,
      currencyCode: true,
      subtotal: true,
      discountTotal: true,
      taxTotal: true,
      grandTotal: true,
      amountPaid: true,
      balanceDue: true,
      createdAt: true,
      dueAt: true,
      issuedAt: true,
      patientId: true
    },
    with: {
      patient: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          mrn: true,
          phone: true
        }
      },
      items: true,
      payments: {
        orderBy: { receivedAt: "desc" }
      }
    }
  });
}

export async function findExpenses() {
  return await db.query.expenses.findMany({
    orderBy: { expenseDate: "desc" }
  });
}
// Add after findExpenses (line ~79)

export async function findInvoicesByPatient(patientId: string) {
  return await db.query.invoices.findMany({
    where: { patientId },
    columns: {
      id: true,
      invoiceNumber: true,
      status: true,
      grandTotal: true,
      amountPaid: true,
      balanceDue: true,
      issuedAt: true,
      dueAt: true
    },
    with: {
      items: true,
      payments: { orderBy: { receivedAt: "desc" } }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function findUnpaidInvoices() {
  return await db.query.invoices.findMany({
    where: {
      status: { in: ["issued", "partially_paid"] }
    },
    columns: {
      id: true,
      invoiceNumber: true,
      status: true,
      grandTotal: true,
      balanceDue: true,
      dueAt: true,
      patientId: true
    },
    with: {
      patient: {
        columns: { id: true, firstName: true, lastName: true, mrn: true, phone: true }
      }
    },
    orderBy: { dueAt: "asc" }
  });
}

export async function findPaymentsByInvoice(invoiceId: string) {
  return await db.query.payments.findMany({
    where: { invoiceId },
    with: {
      receivedByUser: { columns: { id: true, name: true } }
    },
    orderBy: { receivedAt: "desc" }
  });
}
export async function findInvoiceByNumber(invoiceNumber: string) {
  return await db.query.invoices.findFirst({
    where: { invoiceNumber },
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true, mrn: true } },
      items: true,
      payments: { orderBy: { receivedAt: "desc" } }
    }
  });
}

export async function findInvoicesByEncounter(encounterId: string) {
  return await db.query.invoices.findMany({
    where: { encounterId },
    with: { items: true },
    orderBy: { createdAt: "desc" }
  });
}

export async function findInvoicesByAdmission(admissionId: string) {
  return await db.query.invoices.findMany({
    where: { admissionId },
    with: { items: true, payments: true },
    orderBy: { createdAt: "desc" }
  });
}

export async function findOverdueInvoices() {
  return await db.query.invoices.findMany({
    where: {
      status: { in: ["issued", "partially_paid"] },
      dueAt: { lt: new Date() }
    },
    columns: {
      id: true,
      invoiceNumber: true,
      status: true,
      grandTotal: true,
      balanceDue: true,
      dueAt: true,
      patientId: true
    },
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true, mrn: true } }
    },
    orderBy: { dueAt: "asc" }
  });
}

export async function findPaymentsByDateRange(from: Date, to: Date) {
  return await db.query.payments.findMany({
    where: { receivedAt: { gte: from, lte: to } },
    with: {
      invoice: { columns: { id: true, invoiceNumber: true, patientId: true } },
      receivedByUser: { columns: { id: true, name: true } }
    },
    orderBy: { receivedAt: "desc" }
  });
}

export async function findExpensesByDateRange(from: Date, to: Date) {
  return await db.query.expenses.findMany({
    where: {
      expenseDate: {
        gte: from.toISOString().slice(0, 10),
        lte: to.toISOString().slice(0, 10)
      }
    },
    with: { recordedByUser: { columns: { id: true, name: true } } },
    orderBy: { expenseDate: "desc" }
  });
}

export async function insertInvoice(data: typeof invoices.$inferInsert) {
  const [row] = await db.insert(invoices).values(data).returning();
  return row ?? null;
}

export async function insertInvoiceItems(data: (typeof invoiceItems.$inferInsert)[]) {
  if (data.length === 0) return [];
  return await db.insert(invoiceItems).values(data).returning();
}

export async function insertPayment(data: typeof payments.$inferInsert) {
  const [row] = await db.insert(payments).values(data).returning();
  return row ?? null;
}

export async function insertExpense(data: typeof expenses.$inferInsert) {
  const [row] = await db.insert(expenses).values(data).returning();
  return row ?? null;
}

export async function insertChargeCatalogItem(data: typeof chargeCatalog.$inferInsert) {
  const [row] = await db.insert(chargeCatalog).values(data).returning();
  return row ?? null;
}
// queries/billing.ts — APPEND AT END

export async function findInvoiceItemById(id: string) {
  return await db.query.invoiceItems.findFirst({
    where: { id },
    with: {
      invoice: { columns: { id: true, invoiceNumber: true, patientId: true, status: true } }
    }
  });
}

export async function findPaymentById(id: string) {
  return await db.query.payments.findFirst({
    where: { id },
    with: {
      invoice: { columns: { id: true, invoiceNumber: true, patientId: true } },
      receivedByUser: { columns: { id: true, name: true } }
    }
  });
}

export async function findPaymentByNumber(paymentNumber: string) {
  return await db.query.payments.findFirst({
    where: { paymentNumber },
    with: {
      invoice: { columns: { id: true, invoiceNumber: true, patientId: true } },
      receivedByUser: { columns: { id: true, name: true } }
    }
  });
}

export async function updatePayment(id: string, data: Partial<typeof payments.$inferInsert>) {
  const [updated] = await db
    .update(payments)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(payments.id, id))
    .returning();
  return updated ?? null;
}

export async function updateInvoice(id: string, data: Partial<typeof invoices.$inferInsert>) {
  const [updated] = await db
    .update(invoices)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(invoices.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteInvoiceItem(id: string) {
  const [deleted] = await db.delete(invoiceItems).where(eq(invoiceItems.id, id)).returning();
  return deleted ?? null;
}

export async function findExpenseById(id: string) {
  return await db.query.expenses.findFirst({
    where: { id },
    with: { recordedByUser: { columns: { id: true, name: true } } }
  });
}

export async function updateExpense(id: string, data: Partial<typeof expenses.$inferInsert>) {
  const [updated] = await db
    .update(expenses)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(expenses.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteExpense(id: string) {
  const [deleted] = await db.delete(expenses).where(eq(expenses.id, id)).returning();
  return deleted ?? null;
}

export async function updateChargeCatalogItem(
  id: string,
  data: Partial<typeof chargeCatalog.$inferInsert>
) {
  const [updated] = await db
    .update(chargeCatalog)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(chargeCatalog.id, id))
    .returning();
  return updated ?? null;
}

export async function deactivateChargeCatalogItem(id: string) {
  const [updated] = await db
    .update(chargeCatalog)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(chargeCatalog.id, id))
    .returning();
  return updated ?? null;
}

export async function findChargeCatalogItemByCode(code: string) {
  return await db.query.chargeCatalog.findFirst({
    where: { code }
  });
}

export async function sumPaymentsByInvoice(invoiceId: string) {
  const rows = await db.query.payments.findMany({
    where: { invoiceId, status: "completed" },
    columns: { amount: true }
  });
  return rows.reduce((sum, p) => sum + Number(p.amount), 0);
}

export async function countInvoicesByStatus() {
  const rows = await db.query.invoices.findMany({ columns: { status: true } });
  const grouped: Record<string, number> = {};
  for (const r of rows) grouped[r.status] = (grouped[r.status] ?? 0) + 1;
  return grouped;
}
