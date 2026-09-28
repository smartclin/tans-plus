// queries/encounters.ts
import { eq } from "drizzle-orm";

import { db } from "#@/index";
import {
  diagnoses,
  encounters,
  growthMeasurements,
  prescriptionItems,
  prescriptions
} from "#@/schema/clinical";
import { type AddDiagnosisInput, type AddPrescriptionInput } from "#@/validations/encounter";

// ─────────────────────────────────────────────────────────────
// Server-supplied context for prescriptions.
// `prescriberId`, `prescriberName`, `prescriberLicense`, and
// `patientWeightKg` are NOT NULL on the schema, so the query layer
// must receive them from the caller (session + patient record).
// ─────────────────────────────────────────────────────────────
export type PrescriptionContext = {
  prescriberId: string;
  prescriberName: string;
  prescriberLicense: string;
  patientWeightKg: number;
};

export async function findEncounters() {
  return await db.query.encounters.findMany({
    columns: {
      id: true,
      encounterNumber: true,
      status: true,
      chiefComplaint: true,
      startedAt: true,
      completedAt: true,
      patientId: true,
      doctorId: true
    },
    with: {
      patient: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          mrn: true
        }
      },
      doctor: {
        columns: {
          id: true,
          doctorCode: true,
          specialization: true
        },
        with: {
          staff: {
            columns: {
              name: true
            }
          }
        }
      }
    },
    orderBy: { startedAt: "desc" }
  });
}

export async function findEncounterById(id: string) {
  return await db.query.encounters.findFirst({
    where: { id },
    columns: {
      id: true,
      encounterNumber: true,
      status: true,
      chiefComplaint: true,
      history: true,
      examinationNotes: true,
      diagnosisSummary: true,
      treatmentPlan: true,
      startedAt: true,
      completedAt: true,
      patientId: true,
      doctorId: true
    },
    with: {
      patient: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          mrn: true
        }
      },
      doctor: {
        columns: {
          id: true,
          doctorCode: true,
          specialization: true
        },
        with: {
          staff: {
            columns: {
              name: true
            }
          }
        }
      },
      diagnoses: true,
      prescriptions: {
        with: {
          items: true
        }
      }
    }
  });
}

export async function insertEncounter(data: typeof encounters.$inferInsert) {
  const [newEnc] = await db.insert(encounters).values(data).returning();
  return newEnc ?? null;
}

export async function insertDiagnosis(encounterId: string, data: AddDiagnosisInput) {
  const [newDiag] = await db
    .insert(diagnoses)
    .values({
      encounterId,
      ...data
    })
    .returning();
  return newDiag ?? null;
}

// ─────────────────────────────────────────────────────────────
// insertPrescriptionWithItems
//
// FIX: `prescriptions` requires four NOT NULL columns beyond the
// ones the caller was supplying:
//   - prescriberId       (FK → staff.id)
//   - prescriberName     (snapshot)
//   - prescriberLicense  (snapshot)
//   - patientWeightKg    (snapshot at time of prescribing)
//
// These now come in via `ctx: PrescriptionContext`.
// ─────────────────────────────────────────────────────────────
export async function insertPrescriptionWithItems(
  encounterId: string,
  patientId: string,
  doctorId: string,
  prescriptionNumber: string,
  data: AddPrescriptionInput,
  ctx: PrescriptionContext
) {
  return await db.transaction(async (tx) => {
    const [rx] = await tx
      .insert(prescriptions)
      .values({
        prescriptionNumber,
        encounterId,
        patientId,
        doctorId,
        status: "active",

        // Required NOT NULL snapshot fields
        prescriberId: ctx.prescriberId,
        prescriberName: ctx.prescriberName,
        prescriberLicense: ctx.prescriberLicense,
        patientWeightKg: ctx.patientWeightKg,

        // Optional narrative
        diagnosis: data.diagnosis,
        notes: data.notes
      })
      .returning();

    if (!rx) {
      throw new Error("Failed to insert prescription");
    }

    const itemsToInsert = data.items.map((item) => {
      return {
        prescriptionId: rx.id,
        medicineId: item.medicineId,
        medicineNameSnapshot: item.medicineNameSnapshot,
        dosage: item.dosage,
        route: item.route,
        frequency: item.frequency,
        duration: item.duration,
        quantity: item.quantity,
        instructions: item.instructions
      };
    });

    await tx.insert(prescriptionItems).values(itemsToInsert);

    return rx;
  });
}

export async function updateEncounterStatusToCompleted(id: string) {
  const [updated] = await db
    .update(encounters)
    .set({
      status: "completed",
      completedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(encounters.id, id))
    .returning();

  return updated ?? null;
}
// Add after updateEncounterStatusToCompleted (line ~205)

export async function findEncountersByPatient(patientId: string) {
  return await db.query.encounters.findMany({
    where: { patientId },
    columns: {
      id: true,
      encounterNumber: true,
      status: true,
      chiefComplaint: true,
      startedAt: true,
      completedAt: true,
      doctorId: true
    },
    with: {
      doctor: {
        columns: { id: true, doctorCode: true, specialization: true },
        with: { staff: { columns: { name: true } } }
      },
      diagnoses: true,
      prescriptions: { with: { items: true } }
    },
    orderBy: { startedAt: "desc" }
  });
}

export async function findEncountersByDoctor(doctorId: string) {
  return await db.query.encounters.findMany({
    where: { doctorId },
    columns: {
      id: true,
      encounterNumber: true,
      status: true,
      chiefComplaint: true,
      startedAt: true,
      completedAt: true,
      patientId: true
    },
    with: {
      patient: {
        columns: { id: true, firstName: true, lastName: true, mrn: true }
      }
    },
    orderBy: { startedAt: "desc" }
  });
}

export async function updateEncounter(id: string, data: Partial<typeof encounters.$inferInsert>) {
  const [updated] = await db
    .update(encounters)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(encounters.id, id))
    .returning();
  return updated ?? null;
}
export async function findEncounterByNumber(encounterNumber: string) {
  return await db.query.encounters.findFirst({
    where: { encounterNumber },
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true, mrn: true } },
      doctor: {
        columns: { id: true, doctorCode: true, specialization: true },
        with: { staff: { columns: { name: true } } }
      },
      diagnoses: true,
      prescriptions: { with: { items: true } }
    }
  });
}

export async function findEncounterByAppointment(appointmentId: string) {
  return await db.query.encounters.findFirst({
    where: { appointmentId },
    with: { diagnoses: true, prescriptions: { with: { items: true } } }
  });
}

export async function findActiveEncounters() {
  return await db.query.encounters.findMany({
    where: { status: "in_progress" },
    columns: {
      id: true,
      encounterNumber: true,
      chiefComplaint: true,
      startedAt: true,
      patientId: true,
      doctorId: true
    },
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true, mrn: true } },
      doctor: {
        columns: { id: true, doctorCode: true },
        with: { staff: { columns: { name: true } } }
      }
    },
    orderBy: { startedAt: "asc" }
  });
}

export async function findDiagnosesByEncounter(encounterId: string) {
  return await db.query.diagnoses.findMany({
    where: { encounterId },
    orderBy: { isPrimary: "desc" }
  });
}

export async function deleteDiagnosis(id: string) {
  const [deleted] = await db.delete(diagnoses).where(eq(diagnoses.id, id)).returning();
  return deleted ?? null;
}

export async function findPrescriptionsByEncounter(encounterId: string) {
  return await db.query.prescriptions.findMany({
    where: { encounterId },
    with: {
      items: true,
      prescriber: { columns: { id: true, name: true } }
    },
    orderBy: { prescribedAt: "desc" }
  });
}

export async function findPrescriptionsByPatient(patientId: string) {
  return await db.query.prescriptions.findMany({
    where: { patientId },
    with: {
      items: true,
      doctor: {
        columns: { id: true, doctorCode: true },
        with: { staff: { columns: { name: true } } }
      }
    },
    orderBy: { prescribedAt: "desc" }
  });
}

export async function findPrescriptionByNumber(prescriptionNumber: string) {
  return await db.query.prescriptions.findFirst({
    where: { prescriptionNumber },
    with: {
      items: true,
      patient: { columns: { id: true, firstName: true, lastName: true, mrn: true } },
      doctor: {
        columns: { id: true, doctorCode: true },
        with: { staff: { columns: { name: true } } }
      },
      prescriber: { columns: { id: true, name: true, licenseNumber: true } }
    }
  });
}

export async function discontinuePrescription(id: string, reason: string) {
  const [updated] = await db
    .update(prescriptions)
    .set({
      status: "cancelled",
      discontinuedAt: new Date(),
      discontinuedReason: reason,
      updatedAt: new Date()
    })
    .where(eq(prescriptions.id, id))
    .returning();
  return updated ?? null;
}

export async function findGrowthMeasurementsByPatient(patientId: string) {
  return await db.query.growthMeasurements.findMany({
    where: { patientId },
    orderBy: { recordedAt: "desc" }
  });
}

export async function insertGrowthMeasurement(data: typeof growthMeasurements.$inferInsert) {
  const [row] = await db.insert(growthMeasurements).values(data).returning();
  return row ?? null;
}
// queries/encounters.ts — APPEND AT END

export async function findGrowthMeasurementById(id: string) {
  return await db.query.growthMeasurements.findFirst({
    where: { id },
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true, mrn: true } },
      encounter: { columns: { id: true, encounterNumber: true } }
    }
  });
}

export async function findGrowthMeasurementsByEncounter(encounterId: string) {
  return await db.query.growthMeasurements.findMany({
    where: { encounterId },
    orderBy: { recordedAt: "desc" }
  });
}

export async function findLatestGrowthMeasurement(patientId: string) {
  return await db.query.growthMeasurements.findFirst({
    where: { patientId },
    orderBy: { recordedAt: "desc" }
  });
}

export async function updateGrowthMeasurement(
  id: string,
  data: Partial<typeof growthMeasurements.$inferInsert>
) {
  const [updated] = await db
    .update(growthMeasurements)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(growthMeasurements.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteGrowthMeasurement(id: string) {
  const [deleted] = await db
    .delete(growthMeasurements)
    .where(eq(growthMeasurements.id, id))
    .returning();
  return deleted ?? null;
}

export async function findPrescriptionById(id: string) {
  return await db.query.prescriptions.findFirst({
    where: { id },
    with: {
      items: true,
      patient: { columns: { id: true, firstName: true, lastName: true, mrn: true } },
      doctor: {
        columns: { id: true, doctorCode: true },
        with: { staff: { columns: { name: true } } }
      },
      prescriber: { columns: { id: true, name: true, licenseNumber: true } },
      dispensations: { with: { items: true } }
    }
  });
}

export async function updatePrescriptionItem(
  id: string,
  data: Partial<typeof prescriptionItems.$inferInsert>
) {
  const [updated] = await db
    .update(prescriptionItems)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(prescriptionItems.id, id))
    .returning();
  return updated ?? null;
}

export async function deletePrescriptionItem(id: string) {
  const [deleted] = await db
    .delete(prescriptionItems)
    .where(eq(prescriptionItems.id, id))
    .returning();
  return deleted ?? null;
}

export async function findDiagnosisById(id: string) {
  return await db.query.diagnoses.findFirst({
    where: { id },
    with: {
      encounter: { columns: { id: true, encounterNumber: true } }
    }
  });
}

export async function updateDiagnosis(id: string, data: Partial<typeof diagnoses.$inferInsert>) {
  const [updated] = await db
    .update(diagnoses)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(diagnoses.id, id))
    .returning();
  return updated ?? null;
}

export async function findPrimaryDiagnosis(encounterId: string) {
  return await db.query.diagnoses.findFirst({
    where: { encounterId, isPrimary: true }
  });
}

export async function countEncountersByStatus() {
  const rows = await db.query.encounters.findMany({
    columns: { status: true }
  });
  const grouped: Record<string, number> = {};
  for (const r of rows) {
    grouped[r.status] = (grouped[r.status] ?? 0) + 1;
  }
  return grouped;
}
