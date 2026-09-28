// src/db/seeds/seed-medicines.ts
import { faker } from "@faker-js/faker";
// src/db/seeds/seed-pharmacy-inventory.ts

import { type patients } from "#@/schema/index";
import {
  dispensationItems,
  dispensations,
  inventoryTransactions,
  medicineBatches,
  medicines
} from "#@/schema/pharmacy";
import { ids, pick, randFloat, randInt, seedDb } from "#@/seed/helper";

const MEDICINES = [
  { generic: "Amoxicillin", form: "Oral suspension", strength: "250mg/5ml" },
  { generic: "Amoxicillin-Clavulanate", form: "Oral suspension", strength: "600mg/42.9mg/5ml" },
  { generic: "Azithromycin", form: "Oral suspension", strength: "200mg/5ml" },
  { generic: "Cefdinir", form: "Oral suspension", strength: "250mg/5ml" },
  { generic: "Cephalexin", form: "Oral suspension", strength: "250mg/5ml" },
  { generic: "Ibuprofen", form: "Oral suspension", strength: "100mg/5ml" },
  { generic: "Acetaminophen", form: "Oral suspension", strength: "160mg/5ml" },
  { generic: "Cetirizine", form: "Oral solution", strength: "5mg/5ml" },
  { generic: "Loratadine", form: "Oral solution", strength: "5mg/5ml" },
  { generic: "Diphenhydramine", form: "Oral solution", strength: "12.5mg/5ml" },
  { generic: "Albuterol", form: "Nebulizer solution", strength: "2.5mg/3ml" },
  { generic: "Prednisolone", form: "Oral solution", strength: "15mg/5ml" },
  { generic: "Dexamethasone", form: "Oral solution", strength: "1mg/ml" },
  { generic: "Ondansetron", form: "Oral solution", strength: "4mg/5ml" },
  { generic: "Montelukast", form: "Chewable tablet", strength: "4mg" },
  { generic: "Fluticasone", form: "Nasal spray", strength: "50mcg/spray" },
  { generic: "Budesonide", form: "Inhalation suspension", strength: "0.5mg/2ml" },
  { generic: "Amoxicillin", form: "Capsule", strength: "500mg" },
  { generic: "Cephalexin", form: "Capsule", strength: "500mg" },
  { generic: "Ferrous sulfate", form: "Oral solution", strength: "220mg/5ml" }
];

const MANUFACTURERS = ["Teva", "Sandoz", "Mylan", "Aurobindo", "Hikma", "Sun Pharma", "Cipla"];

export async function seedMedicines() {
  const medRows = await seedDb
    .insert(medicines)
    .values(
      MEDICINES.map((m, i) => {
        return {
          code: ids.medicineCode(i + 1),
          genericName: m.generic,
          brandName: faker.helpers.maybe(() => faker.commerce.productName(), { probability: 0.5 }),
          dosageForm: m.form,
          strength: m.strength,
          manufacturer: pick(MANUFACTURERS),
          reorderLevel: randInt(20, 100),
          isActive: true
        };
      })
    )
    .returning();

  const batchRows: (typeof medicineBatches.$inferInsert)[] = [];
  for (const med of medRows) {
    const batchCount = randInt(1, 3);
    for (let b = 0; b < batchCount; b++) {
      const received = randInt(100, 2000);
      const available = randInt(0, received);
      batchRows.push({
        medicineId: med.id,
        batchNumber: `LOT-${faker.string.alphanumeric(8).toUpperCase()}`,
        expiryDate: faker.date.future({ years: 2 }).toISOString().slice(0, 10),
        purchasePrice: randFloat(1.5, 45, 2).toFixed(2),
        salePrice: randFloat(3, 85, 2).toFixed(2),
        quantityReceived: received,
        quantityAvailable: available
      });
    }
  }

  const insertedBatches = await seedDb.insert(medicineBatches).values(batchRows).returning();

  return { medicines: medRows, batches: insertedBatches };
}

type MedicineRow = typeof medicines.$inferSelect;
type BatchRow = typeof medicineBatches.$inferSelect;

const TRANSACTION_TYPES = ["receive", "dispense", "adjustment", "return"] as const;

export async function seedPharmacyInventory(args: {
  medicines: MedicineRow[];
  batches: BatchRow[];
  performedBy: string;
}) {
  const { batches, performedBy } = args;

  const rows: (typeof inventoryTransactions.$inferInsert)[] = [];

  for (const batch of batches) {
    // Initial receive
    rows.push({
      medicineId: batch.medicineId,
      batchId: batch.id,
      transactionType: "receive",
      quantityDelta: batch.quantityReceived,
      referenceType: "purchase_order",
      referenceId: null,
      note: `Initial stock receipt for batch ${batch.batchNumber}`,
      performedBy
    });

    // Random subsequent transactions
    const followUpCount = randInt(0, 3);
    for (let i = 0; i < followUpCount; i++) {
      const type = pick(TRANSACTION_TYPES);
      const delta =
        type === "receive" || type === "return"
          ? randInt(10, 200)
          : type === "dispense"
            ? -randInt(1, 50)
            : randInt(-20, 20);

      rows.push({
        medicineId: batch.medicineId,
        batchId: batch.id,
        transactionType: type,
        quantityDelta: delta,
        referenceType: type === "dispense" ? "prescription" : "manual",
        referenceId: null,
        note: faker.lorem.sentence(),
        performedBy
      });
    }
  }

  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    await seedDb.insert(inventoryTransactions).values(rows.slice(i, i + chunkSize));
  }

  return rows.length;
}

type PatientRow = typeof patients.$inferSelect;

export async function seedDispensations(args: {
  patients: PatientRow[];
  medicines: MedicineRow[];
  batches: BatchRow[];
  dispensedBy: string;
}) {
  const { medicines, batches, dispensedBy } = args;

  const rxRows = await seedDb.query.prescriptions.findMany({
    with: { items: true },
    limit: 40
  });

  let dispensationCount = 0;
  let itemCount = 0;

  for (const rx of rxRows) {
    if (rx.items.length === 0) continue;

    const [dispensation] = await seedDb
      .insert(dispensations)
      .values({
        prescriptionId: rx.id,
        patientId: rx.patientId,
        dispensedBy,
        dispensedAt: new Date(rx.prescribedAt.getTime() + randInt(30, 180) * 60_000)
      })
      .returning();

    dispensationCount++;

    const dispensedItems: (typeof dispensationItems.$inferInsert)[] = [];
    for (const item of rx.items) {
      const med = pick(medicines);
      const availableBatches = batches.filter(
        (b) => b.medicineId === med.id && b.quantityAvailable > 0
      );
      if (availableBatches.length === 0) continue;

      const batch = pick(availableBatches);

      dispensedItems.push({
        dispensationId: dispensation.id,
        prescriptionItemId: item.id,
        medicineId: med.id,
        batchId: batch.id,
        quantity: item.quantity ?? randInt(1, 30),
        unitPriceSnapshot: batch.salePrice
      });
    }

    if (dispensedItems.length > 0) {
      await seedDb.insert(dispensationItems).values(dispensedItems);
      itemCount += dispensedItems.length;
    }
  }

  return { dispensationCount, itemCount };
}
