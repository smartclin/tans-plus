// src/db/seed/index.ts
import { faker } from "@faker-js/faker";

import { LOG_SERVICES } from "@tans/logger/server";

import { seedAuth } from "./auth";
import { seedChargeCatalog, seedExpenses, seedInvoices, seedPayments } from "./billing";
import { seedAuditLogs, seedClinics, seedClinicSettings, seedDepartments } from "./clinic";
import {
  seedAppointments,
  seedEncounters,
  seedGrowthMeasurements,
  seedPrescriptions,
  seedStaffAndDoctors
} from "./clinical";
import { closePool, seedLogger, truncateAll } from "./helper";
import { seedImmunizations } from "./immunization";
import { seedAdmissions, seedWards } from "./inpatient";
import { seedLabOrders, seedLabTests } from "./laboratory";
import { seedPatientClinical, seedPatients } from "./patients";
import { seedDispensations, seedMedicines, seedPharmacyInventory } from "./pharmacy";
import { seedWHOGrowthData } from "./seed-who";

faker.seed(42); // Deterministic output

async function main() {
  const runLogger = seedLogger("seed_run");
  const startedAt = Date.now();

  runLogger.set({
    event: "seed_started",
    service: LOG_SERVICES.SERVER,
    seed: { fakerSeed: 42, wipeFirst: process.env.SEED_WIPE === "true" }
  });

  if (process.env.SEED_WIPE === "true") {
    const truncateLogger = seedLogger("truncate");
    try {
      await truncateAll();
      truncateLogger.emit({ event: "truncate_ok" });
    } catch (error) {
      truncateLogger.error(error instanceof Error ? error : new Error(String(error)));
      truncateLogger.emit({ event: "truncate_failed" });
      throw error;
    }
  }

  try {
    // ─── Phase 1: Foundation ────────────────────────────────
    const phase1 = seedLogger("seed_phase_1_foundation");
    const { adminUser, users, hospitalOrg } = await seedAuth();
    const { clinics } = await seedClinics();
    await seedClinicSettings();
    const { departments } = await seedDepartments();

    phase1.set({
      event: "phase_1_complete",
      counts: {
        users: users.length + 1,
        clinics: clinics.length,
        departments: departments.length
      },
      ids: { adminUserId: adminUser.id, organizationId: hospitalOrg.id }
    });
    phase1.emit();

    // ─── Phase 2: Staff & Doctors ───────────────────────────
    const phase2 = seedLogger("seed_phase_2_staff");
    const { staffRows, doctorRows, scheduleCount } = await seedStaffAndDoctors({
      users,
      clinics,
      departments
    });
    phase2.set({
      event: "phase_2_complete",
      counts: {
        staff: staffRows.length,
        doctors: doctorRows.length,
        schedules: scheduleCount
      }
    });
    phase2.emit();

    // ─── Phase 3: Patients ──────────────────────────────────
    const phase3 = seedLogger("seed_phase_3_patients");
    const { patients } = await seedPatients({
      clinics,
      pediatricianIds: doctorRows.map((d) => d.staffId)
    });
    phase3.set({ event: "phase_3_complete", counts: { patients: patients.length } });
    phase3.emit();

    // ─── Phase 4: Patient clinical sub-records ──────────────
    const phase4 = seedLogger("seed_phase_4_patient_clinical");
    const clinicalCounts = await seedPatientClinical({ patients });
    phase4.set({ event: "phase_4_complete", counts: clinicalCounts });
    phase4.emit();

    // ─── Phase 5: Appointments / encounters / prescriptions ─
    const phase5 = seedLogger("seed_phase_5_encounters");
    const { appointments } = await seedAppointments({
      patients,
      doctors: doctorRows,
      bookedBy: adminUser.id
    });
    const { encounters } = await seedEncounters({
      patients,
      doctors: doctorRows,
      appointments
    });
    const rxResult = await seedPrescriptions({
      encounters,
      doctors: doctorRows,
      staffRows
    });
    phase5.set({
      event: "phase_5_complete",
      counts: {
        appointments: appointments.length,
        encounters: encounters.length,
        prescriptions: rxResult.prescriptionCount
      }
    });
    phase5.emit();

    // ─── Phase 6: Immunizations + growth ────────────────────
    const phase6 = seedLogger("seed_phase_6_immunizations_growth");
    const immunizationCount = await seedImmunizations({
      patients,
      adminUserId: adminUser.id
    });
    const growthCount = await seedGrowthMeasurements({
      patients,
      recordedBy: adminUser.id
    });
    phase6.set({
      event: "phase_6_complete",
      counts: { immunizations: immunizationCount, growthMeasurements: growthCount }
    });
    phase6.emit();

    // ─── Phase 7: Inpatient ─────────────────────────────────
    const phase7 = seedLogger("seed_phase_7_inpatient");
    const { wards, rooms, beds } = await seedWards();
    const { admissionCount } = await seedAdmissions({
      patients,
      doctors: doctorRows,
      beds,
      createdBy: adminUser.id
    });
    phase7.set({
      event: "phase_7_complete",
      counts: {
        wards: wards.length,
        rooms: rooms.length,
        beds: beds.length,
        admissions: admissionCount
      }
    });
    phase7.emit();

    // ─── Phase 8: Laboratory ────────────────────────────────
    const phase8 = seedLogger("seed_phase_8_lab");
    const { labTests } = await seedLabTests();
    const { labOrderCount } = await seedLabOrders({
      patients,
      doctors: doctorRows,
      labTests,
      encounters
    });
    phase8.set({
      event: "phase_8_complete",
      counts: { labTests: labTests.length, labOrders: labOrderCount }
    });
    phase8.emit();

    // ─── Phase 9: Pharmacy ──────────────────────────────────
    const phase9 = seedLogger("seed_phase_9_pharmacy");
    const { medicines, batches } = await seedMedicines();
    await seedPharmacyInventory({
      medicines,
      batches,
      performedBy: adminUser.id
    });
    const dispensationResult = await seedDispensations({
      patients,
      medicines,
      batches,
      dispensedBy: adminUser.id
    });
    phase9.set({
      event: "phase_9_complete",
      counts: {
        medicines: medicines.length,
        batches: batches.length,
        dispensations: dispensationResult.dispensationCount
      }
    });
    phase9.emit();

    // ─── Phase 10: Billing ──────────────────────────────────
    const phase10 = seedLogger("seed_phase_10_billing");
    await seedChargeCatalog();
    const { invoices } = await seedInvoices({ patients, createdBy: adminUser.id });
    const paymentCount = await seedPayments({ invoices, receivedBy: adminUser.id });
    const expenseCount = await seedExpenses({ recordedBy: adminUser.id });
    phase10.set({
      event: "phase_10_complete",
      counts: {
        invoices: invoices.length,
        payments: paymentCount,
        expenses: expenseCount
      }
    });
    phase10.emit();

    // ─── Phase 11: Audit ────────────────────────────────────
    const phase11 = seedLogger("seed_phase_11_audit");
    const auditCount = await seedAuditLogs({
      userIds: [adminUser.id, ...users.map((u) => u.id)]
    });
    phase11.set({ event: "phase_11_complete", counts: { auditLogs: auditCount } });
    phase11.emit();

    // ─── Phase 12: WHO Growth Reference (optional) ──────────
    if (process.env.SEED_WHO === "true") {
      const phase12 = seedLogger("seed_phase_12_who");
      await seedWHOGrowthData(process.env.WHO_DATA_DIR);
      phase12.set({ event: "phase_12_complete" });
      phase12.emit();
    }

    // ─── Success ────────────────────────────────────────────
    runLogger.set({
      event: "seed_completed",
      durationMs: Date.now() - startedAt
    });
    runLogger.emit();
  } catch (error) {
    runLogger.error(error instanceof Error ? error : new Error(String(error)));
    runLogger.set({
      event: "seed_failed",
      durationMs: Date.now() - startedAt
    });
    runLogger.emit();
    throw error;
  }
}

main()
  .catch(() => {
    process.exit(1);
  })
  .finally(() => closePool());
