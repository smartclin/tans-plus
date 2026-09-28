import { faker } from "@faker-js/faker";

// src/db/seeds/seed-charge-catalog.ts
import { chargeCatalog, expenses, invoiceItems, invoices, payments } from "#@/schema/billing";
import {
  daysAgo,
  ids,
  type NewInvoiceItemRow,
  type PatientRow,
  pick,
  pickN,
  randFloat,
  randInt,
  seedDb
} from "#@/seed/helper";

const CHARGES = [
  { name: "New Patient Consultation", category: "Consultation", amount: 250 },
  { name: "Follow-Up Consultation", category: "Consultation", amount: 150 },
  { name: "Emergency Visit", category: "Consultation", amount: 350 },
  { name: "Well-Child Visit", category: "Preventive", amount: 200 },
  { name: "Immunization Administration", category: "Preventive", amount: 40 },
  { name: "Nebulizer Treatment", category: "Procedure", amount: 85 },
  { name: "Wound Dressing — Minor", category: "Procedure", amount: 120 },
  { name: "Wound Dressing — Complex", category: "Procedure", amount: 280 },
  { name: "IV Fluid Administration", category: "Procedure", amount: 180 },
  { name: "Suture Removal", category: "Procedure", amount: 75 },
  { name: "Basic Metabolic Panel", category: "Laboratory", amount: 65 },
  { name: "Complete Blood Count", category: "Laboratory", amount: 45 },
  { name: "Urinalysis", category: "Laboratory", amount: 30 },
  { name: "Rapid Strep Test", category: "Laboratory", amount: 25 },
  { name: "Chest X-Ray", category: "Imaging", amount: 220 },
  { name: "Abdominal Ultrasound", category: "Imaging", amount: 380 },
  { name: "Echocardiogram", category: "Imaging", amount: 850 },
  { name: "General Ward Room — Day", category: "Room & Board", amount: 400 },
  { name: "PICU Room — Day", category: "Room & Board", amount: 1200 },
  { name: "NICU Room — Day", category: "Room & Board", amount: 1500 },
  { name: "Private Room — Day", category: "Room & Board", amount: 700 },
  { name: "Nursing — Hourly", category: "Nursing", amount: 90 },
  { name: "Physical Therapy Session", category: "Therapy", amount: 180 },
  { name: "Speech Therapy Session", category: "Therapy", amount: 175 },
  { name: "Occupational Therapy Session", category: "Therapy", amount: 190 }
];

export async function seedChargeCatalog() {
  const rows = await seedDb
    .insert(chargeCatalog)
    .values(
      CHARGES.map((c, i) => {
        return {
          code: ids.chargeCode(i + 1),
          name: c.name,
          category: c.category,
          defaultAmount: c.amount.toFixed(2),
          isActive: true
        };
      })
    )
    .returning();

  return rows.length;
}

const INVOICE_STATUSES = ["draft", "issued", "partially_paid", "paid", "void"] as const;

export async function seedInvoices(args: { patients: PatientRow[]; createdBy: string }) {
  const { patients, createdBy } = args;

  const catalogItems = await seedDb.query.chargeCatalog.findMany();
  if (catalogItems.length === 0) {
    throw new Error("Charge catalog must be seeded before invoices");
  }

  const invoiceCount = 60;
  const invoiceRows: InvoiceRow[] = [];
  const itemRows: NewInvoiceItemRow[] = [];

  for (let i = 1; i <= invoiceCount; i++) {
    const patient = pick(patients);
    const status = pick(INVOICE_STATUSES);
    const issuedAt =
      status === "draft" ? null : faker.date.between({ from: daysAgo(120), to: new Date() });
    const createdAt = issuedAt ?? daysAgo(randInt(1, 120));

    // 1-6 line items
    const lineCount = randInt(1, 6);
    const selectedCharges = pickN(catalogItems, lineCount);

    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    const lineItems: NewInvoiceItemRow[] = [];

    for (const charge of selectedCharges) {
      const quantity = randInt(1, 3);
      const unitPrice = Number(charge.defaultAmount);
      const discount = Math.random() < 0.15 ? Number((unitPrice * quantity * 0.1).toFixed(2)) : 0;
      const tax = Number(((unitPrice * quantity - discount) * 0.05).toFixed(2));
      const lineTotal = Number((unitPrice * quantity - discount + tax).toFixed(2));

      subtotal += unitPrice * quantity;
      discountTotal += discount;
      taxTotal += tax;

      lineItems.push({
        invoiceId: "", // filled after invoice insert
        sourceType: "charge_catalog",
        sourceId: charge.id,
        descriptionSnapshot: charge.name,
        quantity: quantity.toFixed(2),
        unitPrice: unitPrice.toFixed(2),
        discountAmount: discount.toFixed(2),
        taxAmount: tax.toFixed(2),
        lineTotal: lineTotal.toFixed(2)
      });
    }

    const grandTotal = Number((subtotal - discountTotal + taxTotal).toFixed(2));
    const amountPaid =
      status === "paid"
        ? grandTotal
        : status === "partially_paid"
          ? Number((grandTotal * randFloatFraction(0.2, 0.8)).toFixed(2))
          : 0;
    const balanceDue = Number((grandTotal - amountPaid).toFixed(2));

    const [invoice] = await seedDb
      .insert(invoices)
      .values({
        invoiceNumber: ids.invoiceNumber(i),
        patientId: patient.id,
        encounterId: null,
        admissionId: null,
        status,
        currencyCode: "USD",
        subtotal: subtotal.toFixed(2),
        discountTotal: discountTotal.toFixed(2),
        taxTotal: taxTotal.toFixed(2),
        grandTotal: grandTotal.toFixed(2),
        amountPaid: amountPaid.toFixed(2),
        balanceDue: balanceDue.toFixed(2),
        issuedAt,
        dueAt: issuedAt ? new Date(issuedAt.getTime() + 30 * 86_400_000) : null,
        createdBy,
        createdAt
      })
      .returning();

    invoiceRows.push(invoice);

    for (const item of lineItems) {
      itemRows.push({ ...item, invoiceId: invoice.id, createdAt: item.createdAt ?? new Date() });
    }
  }

  await seedDb.insert(invoiceItems).values(itemRows);

  return { invoices: invoiceRows, itemCount: itemRows.length };
}

function randFloatFraction(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
type InvoiceRow = typeof invoices.$inferSelect;

const PAYMENT_METHODS = ["cash", "card", "bank_transfer", "insurance", "other"] as const;

export async function seedPayments(args: { invoices: InvoiceRow[]; receivedBy: string }) {
  const { invoices, receivedBy } = args;

  const rows: (typeof payments.$inferInsert)[] = [];

  let counter = 1;
  for (const invoice of invoices) {
    if (invoice.status === "draft" || invoice.status === "void") continue;
    if (Number(invoice.amountPaid) === 0) continue;

    // 1-2 payments per invoice
    const paymentCount = randInt(1, 2);
    const total = Number(invoice.amountPaid);
    let remaining = total;

    for (let i = 0; i < paymentCount; i++) {
      const isLast = i === paymentCount - 1;
      const amount = isLast
        ? remaining
        : Number((total / paymentCount + randInt(-20, 20)).toFixed(2));
      if (amount <= 0) continue;
      remaining -= amount;

      rows.push({
        paymentNumber: ids.paymentNumber(counter++),
        invoiceId: invoice.id,
        amount: amount.toFixed(2),
        paymentMethod: pick(PAYMENT_METHODS),
        status: "completed",
        transactionReference: faker.string.alphanumeric(16).toUpperCase(),
        receivedBy,
        receivedAt: invoice.issuedAt
          ? new Date(invoice.issuedAt.getTime() + randInt(1, 30) * 86_400_000)
          : new Date(),
        note: null
      });
    }
  }

  if (rows.length > 0) {
    await seedDb.insert(payments).values(rows);
  }

  return rows.length;
}

const CATEGORIES = [
  "Medical Supplies",
  "Pharmaceuticals",
  "Equipment Maintenance",
  "Utilities",
  "Staff Salaries",
  "Rent",
  "Insurance",
  "IT Services",
  "Cleaning Services",
  "Training"
];

const VENDORS = [
  "MedSupply Co.",
  "PharmaDirect",
  "BioTech Solutions",
  "CityPower Utilities",
  "CleanPro Services",
  "TechCare IT",
  "SafeGuard Insurance",
  "Office Depot",
  "LabCorp Supplies",
  "HealthTech Equipment"
];

export async function seedExpenses(args: { recordedBy: string }) {
  const { recordedBy } = args;

  const rows: (typeof expenses.$inferInsert)[] = [];

  for (let i = 1; i <= 40; i++) {
    const expenseDate = daysAgo(faker.number.int({ min: 1, max: 180 }));
    rows.push({
      expenseNumber: ids.expenseNumber(i),
      category: pick(CATEGORIES),
      description: faker.commerce.productDescription(),
      amount: randFloat(50, 5000, 2).toFixed(2),
      expenseDate: expenseDate.toISOString().slice(0, 10),
      paymentMethod: pick(PAYMENT_METHODS),
      vendorName: pick(VENDORS),
      referenceNumber: `REF-${faker.string.alphanumeric(10).toUpperCase()}`,
      recordedBy
    });
  }

  await seedDb.insert(expenses).values(rows);

  return rows.length;
}
