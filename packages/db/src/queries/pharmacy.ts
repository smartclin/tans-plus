import { db, eq } from "#@/index";
import {
  dispensationItems,
  dispensations,
  inventoryTransactions,
  medicineBatches,
  medicines
} from "#@/schema/pharmacy";
import { type CreateMedicineInput } from "#@/validations/pharmacy";

export async function findMedicines() {
  return await db.query.medicines.findMany();
}

export async function findMedicineBatches(medicineId?: string) {
  return await db.query.medicineBatches.findMany({
    where: { medicineId },
    with: {
      medicine: {
        columns: {
          id: true,
          genericName: true,
          brandName: true,
          strength: true
        }
      }
    }
  });
}

export async function findMedicineById(id: string) {
  return await db.query.medicines.findFirst({
    where: { id },
    with: {
      batches: true,
      inventoryTransactions: {
        orderBy: { createdAt: "desc" },
        limit: 50
      }
    }
  });
}

export async function insertMedicine(data: CreateMedicineInput) {
  const [med] = await db.insert(medicines).values(data).returning();
  return med;
}

export async function findDispensations() {
  return await db.query.dispensations.findMany({
    with: {
      patient: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          mrn: true
        }
      },
      prescription: {
        columns: {
          id: true,
          prescriptionNumber: true,
          status: true
        }
      },
      dispensedByUser: {
        columns: {
          id: true,
          name: true
        }
      },
      items: {
        with: {
          medicine: true,
          batch: true
        }
      }
    },
    orderBy: { dispensedAt: "desc" }
  });
}
// Add after findDispensations (line ~76)

export async function findMedicineByCode(code: string) {
  return await db.query.medicines.findFirst({
    where: { code },
    with: { batches: true }
  });
}

export async function findActiveMedicines() {
  return await db.query.medicines.findMany({
    where: { isActive: true },
    with: {
      batches: {
        where: { quantityAvailable: { gt: 0 } },
        orderBy: { expiryDate: "asc" }
      }
    },
    orderBy: { genericName: "asc" }
  });
}

export async function findLowStockMedicines() {
  const rows = await db.query.medicines.findMany({
    where: { isActive: true },
    with: { batches: true }
  });

  return rows.filter((m) => {
    const total = m.batches.reduce((sum, b) => sum + b.quantityAvailable, 0);
    return total <= m.reorderLevel;
  });
}

export async function findExpiringBatches(daysAhead: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + daysAhead);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  return await db.query.medicineBatches.findMany({
    where: {
      expiryDate: { lte: cutoffStr },
      quantityAvailable: { gt: 0 }
    },
    with: {
      medicine: { columns: { id: true, genericName: true, strength: true } }
    },
    orderBy: { expiryDate: "asc" }
  });
}

export async function insertMedicineBatch(data: typeof medicineBatches.$inferInsert) {
  const [batch] = await db.insert(medicineBatches).values(data).returning();
  return batch ?? null;
}

export async function insertInventoryTransaction(data: typeof inventoryTransactions.$inferInsert) {
  const [tx] = await db.insert(inventoryTransactions).values(data).returning();
  return tx ?? null;
}

export async function findInventoryTransactions(medicineId: string) {
  return await db.query.inventoryTransactions.findMany({
    where: { medicineId },
    with: {
      batch: { columns: { id: true, batchNumber: true, expiryDate: true } },
      performedByUser: { columns: { id: true, name: true } }
    },
    orderBy: { createdAt: "desc" },
    limit: 100
  });
}

export async function findDispensationById(id: string) {
  return await db.query.dispensations.findFirst({
    where: { id },
    with: {
      patient: {
        columns: { id: true, firstName: true, lastName: true, mrn: true }
      },
      prescription: {
        columns: { id: true, prescriptionNumber: true, status: true },
        with: {
          items: { with: { medicine: true } },
          prescriber: { columns: { id: true, name: true } }
        }
      },
      dispensedByUser: { columns: { id: true, name: true } },
      items: {
        with: {
          medicine: true,
          batch: true,
          prescriptionItem: true
        }
      }
    }
  });
}

export async function findDispensationsByPatient(patientId: string) {
  return await db.query.dispensations.findMany({
    where: { patientId },
    with: {
      prescription: {
        columns: { id: true, prescriptionNumber: true, status: true }
      },
      dispensedByUser: { columns: { id: true, name: true } },
      items: { with: { medicine: true } }
    },
    orderBy: { dispensedAt: "desc" }
  });
}

export async function insertDispensationWithItems(data: {
  prescriptionId: string;
  patientId: string;
  dispensedBy: string;
  items: Array<{
    prescriptionItemId: string;
    medicineId: string;
    batchId: string;
    quantity: number;
    unitPriceSnapshot: string;
  }>;
}) {
  return await db.transaction(async (tx) => {
    const [dispensation] = await tx
      .insert(dispensations)
      .values({
        prescriptionId: data.prescriptionId,
        patientId: data.patientId,
        dispensedBy: data.dispensedBy
      })
      .returning();

    if (!dispensation) throw new Error("Failed to insert dispensation");

    await tx.insert(dispensationItems).values(
      data.items.map((item) => {
        return {
          dispensationId: dispensation.id,
          ...item
        };
      })
    );

    return dispensation;
  });
}
export async function updateMedicine(id: string, data: Partial<typeof medicines.$inferInsert>) {
  const [updated] = await db
    .update(medicines)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(medicines.id, id))
    .returning();
  return updated ?? null;
}

export async function deactivateMedicine(id: string) {
  const [updated] = await db
    .update(medicines)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(medicines.id, id))
    .returning();
  return updated ?? null;
}

export async function findBatchById(id: string) {
  return await db.query.medicineBatches.findFirst({
    where: { id },
    with: { medicine: true }
  });
}

export async function findBatchesByMedicine(medicineId: string) {
  return await db.query.medicineBatches.findMany({
    where: { medicineId, quantityAvailable: { gt: 0 } },
    orderBy: { expiryDate: "asc" }
  });
}

export async function updateBatchQuantity(id: string, quantityAvailable: number) {
  const [updated] = await db
    .update(medicineBatches)
    .set({ quantityAvailable, updatedAt: new Date() })
    .where(eq(medicineBatches.id, id))
    .returning();
  return updated ?? null;
}

export async function findDispensationByPrescription(prescriptionId: string) {
  return await db.query.dispensations.findFirst({
    where: { prescriptionId },
    with: {
      items: { with: { medicine: true, batch: true } },
      dispensedByUser: { columns: { id: true, name: true } }
    }
  });
}

export async function findInventoryTransactionsByBatch(batchId: string) {
  return await db.query.inventoryTransactions.findMany({
    where: { batchId },
    with: { performedByUser: { columns: { id: true, name: true } } },
    orderBy: { createdAt: "desc" }
  });
}

export async function countLowStockMedicines() {
  const rows = await db.query.medicines.findMany({
    where: { isActive: true },
    with: { batches: { columns: { quantityAvailable: true } } }
  });
  return rows.filter((m) => {
    const total = m.batches.reduce((sum, b) => sum + b.quantityAvailable, 0);
    return total <= m.reorderLevel;
  }).length;
}
// queries/pharmacy.ts — APPEND AT END

export async function findDispensationItemById(id: string) {
  return await db.query.dispensationItems.findFirst({
    where: { id },
    with: {
      dispensation: { columns: { id: true, dispensedAt: true, patientId: true } },
      prescriptionItem: true,
      medicine: true,
      batch: true
    }
  });
}

export async function findInventoryTransactionById(id: string) {
  return await db.query.inventoryTransactions.findFirst({
    where: { id },
    with: {
      medicine: { columns: { id: true, genericName: true, strength: true } },
      batch: { columns: { id: true, batchNumber: true, expiryDate: true } },
      performedByUser: { columns: { id: true, name: true } }
    }
  });
}

export async function deleteMedicineBatch(id: string) {
  const [deleted] = await db.delete(medicineBatches).where(eq(medicineBatches.id, id)).returning();
  return deleted ?? null;
}

export async function findBatchesExpiringBefore(dateStr: string) {
  return await db.query.medicineBatches.findMany({
    where: {
      expiryDate: { lte: dateStr },
      quantityAvailable: { gt: 0 }
    },
    with: { medicine: { columns: { id: true, genericName: true, strength: true } } },
    orderBy: { expiryDate: "asc" }
  });
}

export async function findMedicineInventorySummary() {
  const rows = await db.query.medicines.findMany({
    where: { isActive: true },
    with: {
      batches: { columns: { quantityAvailable: true, expiryDate: true } }
    },
    orderBy: { genericName: "asc" }
  });
  return rows.map((m) => {
    return {
      id: m.id,
      code: m.code,
      genericName: m.genericName,
      brandName: m.brandName,
      strength: m.strength,
      reorderLevel: m.reorderLevel,
      totalAvailable: m.batches.reduce((s, b) => s + b.quantityAvailable, 0)
    };
  });
}

export async function countInventoryTransactionsByType(medicineId: string) {
  const rows = await db.query.inventoryTransactions.findMany({
    where: { medicineId },
    columns: { transactionType: true }
  });
  const grouped: Record<string, number> = {};
  for (const r of rows) grouped[r.transactionType] = (grouped[r.transactionType] ?? 0) + 1;
  return grouped;
}
