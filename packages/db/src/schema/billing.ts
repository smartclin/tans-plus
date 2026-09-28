import {
  boolean,
  date,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

import { timestamps } from "#@/schema/_helper";
import { user } from "#@/schema/auth";
import { encounters } from "#@/schema/clinical";
import { invoiceStatusEnum, paymentMethodEnum, paymentStatusEnum } from "#@/schema/common";
import { admissions } from "#@/schema/inpatient";
import { patients } from "#@/schema/patients";

export const chargeCatalog = pgTable(
  "charge_catalog",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    defaultAmount: numeric("default_amount", { precision: 10, scale: 2 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps
  },
  (t) => [
    index("idx_charge_catalog_category").on(t.category),
    index("idx_charge_catalog_active").on(t.isActive)
  ]
);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
    patientId: uuid("patient_id")
      .references(() => patients.id)
      .notNull(),
    encounterId: uuid("encounter_id").references(() => encounters.id),
    admissionId: uuid("admission_id").references(() => admissions.id),
    status: invoiceStatusEnum("status").default("draft").notNull(),
    currencyCode: varchar("currency_code", { length: 10 }).default("USD").notNull(),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).default("0").notNull(),
    discountTotal: numeric("discount_total", { precision: 12, scale: 2 }).default("0").notNull(),
    taxTotal: numeric("tax_total", { precision: 12, scale: 2 }).default("0").notNull(),
    grandTotal: numeric("grand_total", { precision: 12, scale: 2 }).default("0").notNull(),
    amountPaid: numeric("amount_paid", { precision: 12, scale: 2 }).default("0").notNull(),
    balanceDue: numeric("balance_due", { precision: 12, scale: 2 }).default("0").notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    createdBy: text("created_by")
      .references(() => user.id)
      .notNull(),
    ...timestamps
  },
  (t) => [
    index("idx_invoices_patient_issued").on(t.patientId, t.issuedAt.desc()),
    index("idx_invoices_status_due").on(t.status, t.dueAt),
    index("idx_invoices_encounter").on(t.encounterId),
    index("idx_invoices_admission").on(t.admissionId)
  ]
);

export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceId: uuid("invoice_id")
      .references(() => invoices.id)
      .notNull(),
    sourceType: varchar("source_type", { length: 50 }),
    sourceId: uuid("source_id"),
    descriptionSnapshot: varchar("description_snapshot", { length: 255 }).notNull(),
    quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).default("0").notNull(),
    taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).default("0").notNull(),
    lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
    ...timestamps
  },
  (table) => [index("idx_invoice_items_invoice").on(table.invoiceId)]
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paymentNumber: varchar("payment_number", { length: 50 }).notNull().unique(),
    invoiceId: uuid("invoice_id")
      .references(() => invoices.id)
      .notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    paymentMethod: paymentMethodEnum("payment_method"),
    status: paymentStatusEnum("status").default("completed").notNull(),
    transactionReference: varchar("transaction_reference", { length: 255 }),
    receivedBy: text("received_by")
      .references(() => user.id)
      .notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
    note: varchar("note", { length: 500 }),
    ...timestamps
  },
  (table) => [
    index("idx_payments_invoice").on(table.invoiceId),
    index("idx_payments_received_at").on(table.receivedAt.desc())
  ]
);

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  expenseNumber: varchar("expense_number", { length: 50 }).notNull().unique(),
  category: varchar("category", { length: 100 }).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  expenseDate: date("expense_date").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  vendorName: varchar("vendor_name", { length: 255 }),
  referenceNumber: varchar("reference_number", { length: 255 }),
  recordedBy: text("recorded_by")
    .references(() => user.id)
    .notNull(),
  ...timestamps
});
