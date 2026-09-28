import { z } from "zod";

// ─── Enums ───────────────────────────────────────────────────
export const paymentMethodSchema = z.enum(["cash", "card", "bank_transfer", "insurance", "other"]);

export const invoiceStatusSchema = z.enum(["draft", "issued", "partially_paid", "paid", "void"]);

export const paymentStatusSchema = z.enum(["pending", "completed", "failed", "refunded"]);

// ─── Charge Catalog ──────────────────────────────────────────
export const createChargeCatalogItemSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  category: z.string().min(1).max(100),
  defaultAmount: z.coerce.number().min(0),
  isActive: z.boolean().default(true)
});

// ─── Invoice ─────────────────────────────────────────────────
// FIXED: `createdBy` is NOT NULL FK — server-injected.
// FIXED: `invoiceNumber` is NOT NULL UNIQUE — generate server-side.
export const invoiceLineItemSchema = z.object({
  sourceType: z.string().max(50).optional(),
  sourceId: z.string().uuid().optional(),
  descriptionSnapshot: z.string().min(1).max(255),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().min(0),
  discountAmount: z.coerce.number().min(0).default(0),
  taxAmount: z.coerce.number().min(0).default(0)
  // NOTE: lineTotal is computed server-side
});

export const createInvoiceSchema = z.object({
  patientId: z.string().uuid(),
  encounterId: z.string().uuid().optional(),
  admissionId: z.string().uuid().optional(),
  currencyCode: z.string().max(10).default("USD"),
  dueAt: z.coerce.date().optional(),
  items: z.array(invoiceLineItemSchema).min(1)
});

export type CreateInvoiceServerInput = z.infer<typeof createInvoiceSchema> & {
  invoiceNumber: string;
  createdBy: string; // user.id
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  grandTotal: string;
  balanceDue: string;
};

// ─── Payment ─────────────────────────────────────────────────
// FIXED: `paymentNumber` and `receivedBy` are NOT NULL — server-injected.
export const recordPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  paymentMethod: paymentMethodSchema,
  transactionReference: z.string().max(255).optional(),
  note: z.string().max(500).optional(),
  receivedAt: z.coerce.date().optional()
});

export type RecordPaymentServerInput = z.infer<typeof recordPaymentSchema> & {
  paymentNumber: string;
  receivedBy: string; // user.id
};

// ─── Expense ─────────────────────────────────────────────────
// FIXED: `expenseNumber` and `recordedBy` NOT NULL — server-injected.
export const createExpenseSchema = z.object({
  category: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  amount: z.coerce.number().positive(),
  expenseDate: z.coerce.date(),
  paymentMethod: z.string().max(50).optional(),
  vendorName: z.string().max(255).optional(),
  referenceNumber: z.string().max(255).optional()
});

export type CreateExpenseServerInput = z.infer<typeof createExpenseSchema> & {
  expenseNumber: string;
  recordedBy: string; // user.id
};

// ─── Types ───────────────────────────────────────────────────
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;
export type CreateChargeCatalogItemInput = z.infer<typeof createChargeCatalogItemSchema>;
export type InvoiceLineItemInput = z.infer<typeof invoiceLineItemSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
