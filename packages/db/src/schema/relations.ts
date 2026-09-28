// schema/relations.ts
import { defineRelations } from "drizzle-orm";

import * as schema from "#@/schema/index";

export const relations = defineRelations(schema, (r) => {
  return {
    // ============================================================
    // AUTH / RBAC
    // ============================================================
    user: {
      // ─── Auth ──────────────────────────────────────────────
      sessions: r.many.session({
        from: r.user.id,
        to: r.session.userId
      }),
      accounts: r.many.account({
        from: r.user.id,
        to: r.account.userId
      }),

      // ─── Profiles ──────────────────────────────────────────

      staffProfile: r.one.staff({
        from: r.user.id,
        to: r.staff.userId
      }),
      patientProfile: r.one.patients({
        from: r.user.id,
        to: r.patients.userId
      }),

      // ─── Billing ───────────────────────────────────────────
      createdInvoices: r.many.invoices({
        from: r.user.id,
        to: r.invoices.createdBy
      }),
      receivedPayments: r.many.payments({
        from: r.user.id,
        to: r.payments.receivedBy
      }),
      recordedExpenses: r.many.expenses({
        from: r.user.id,
        to: r.expenses.recordedBy
      }),

      // ─── Inpatient ─────────────────────────────────────────
      createdAdmissions: r.many.admissions({
        from: r.user.id,
        to: r.admissions.createdBy
      }),
      allocatedBeds: r.many.bedAllocations({
        from: r.user.id,
        to: r.bedAllocations.allocatedBy
      }),
      endedBedAllocations: r.many.bedAllocations({
        from: r.user.id,
        to: r.bedAllocations.endedBy
      }),
      clinicalNotes: r.many.clinicalNotes({
        from: r.user.id,
        to: r.clinicalNotes.authorUserId
      }),

      // ─── Lab ───────────────────────────────────────────────
      resultedLabItems: r.many.labOrderItems({
        from: r.user.id,
        to: r.labOrderItems.resultedByUserId
      }),

      // ─── Documents ─────────────────────────────────────────
      uploadedPatientDocuments: r.many.patientDocuments({
        from: r.user.id,
        to: r.patientDocuments.uploadedBy
      }),

      // ─── Pharmacy ──────────────────────────────────────────
      inventoryTransactions: r.many.inventoryTransactions({
        from: r.user.id,
        to: r.inventoryTransactions.performedBy
      }),
      dispensations: r.many.dispensations({
        from: r.user.id,
        to: r.dispensations.dispensedBy
      }),

      // ─── Guardians ─────────────────────────────────────────
      guardianProfiles: r.many.guardians({
        from: r.user.id,
        to: r.guardians.userId
      }),

      // ─── Audit ─────────────────────────────────────────────
      auditLogs: r.many.auditLogs({
        from: r.user.id,
        to: r.auditLogs.actorUserId
      })
    },

    session: {
      user: r.one.user({
        from: r.session.userId,
        to: r.user.id,
        optional: false
      })
    },

    account: {
      user: r.one.user({
        from: r.account.userId,
        to: r.user.id,
        optional: false
      })
    },

    verification: {},

    // ============================================================
    // CLINIC
    // ============================================================
    clinics: {
      staff: r.many.staff({
        from: r.clinics.id,
        to: r.staff.clinicId
      }),
      patients: r.many.patients({
        from: r.clinics.id,
        to: r.patients.clinicId
      })
    },

    clinicSettings: {},

    departments: {
      doctors: r.many.doctors({
        from: r.departments.id,
        to: r.doctors.departmentId
      })
    },

    auditLogs: {
      actor: r.one.user({
        from: r.auditLogs.actorUserId,
        to: r.user.id
      })
    },

    // ============================================================
    // PATIENTS
    // ============================================================
    patients: {
      user: r.one.user({
        from: r.patients.userId,
        to: r.user.id,
        optional: false
      }),
      pediatrician: r.one.staff({
        from: r.patients.pediatricianId,
        to: r.staff.id
      }),
      clinic: r.one.clinics({
        from: r.patients.clinicId,
        to: r.clinics.id
      }),

      // ─── Clinical sub-records ──────────────────────────────
      guardians: r.many.guardians({
        from: r.patients.id,
        to: r.guardians.patientId
      }),
      allergies: r.many.patientAllergies({
        from: r.patients.id,
        to: r.patientAllergies.patientId
      }),
      chronicConditions: r.many.patientChronicConditions({
        from: r.patients.id,
        to: r.patientChronicConditions.patientId
      }),
      documents: r.many.patientDocuments({
        from: r.patients.id,
        to: r.patientDocuments.patientId
      }),

      // ─── Predefined filters (active-only) ──────────────────
      activeAllergies: r.many.patientAllergies({
        from: r.patients.id,
        to: r.patientAllergies.patientId,
        where: { status: "Active" }
      }),
      activeConditions: r.many.patientChronicConditions({
        from: r.patients.id,
        to: r.patientChronicConditions.patientId,
        where: { status: "Active" }
      }),
      activePrescriptions: r.many.prescriptions({
        from: r.patients.id,
        to: r.prescriptions.patientId,
        where: { status: "active" }
      }),

      // ─── Timeline relations (ordered) ──────────────────────
      appointments: r.many.appointments({
        from: r.patients.id,
        to: r.appointments.patientId
      }),
      encounters: r.many.encounters({
        from: r.patients.id,
        to: r.encounters.patientId
      }),
      prescriptions: r.many.prescriptions({
        from: r.patients.id,
        to: r.prescriptions.patientId
      }),
      immunizations: r.many.immunizations({
        from: r.patients.id,
        to: r.immunizations.patientId
      }),
      growthMeasurements: r.many.growthMeasurements({
        from: r.patients.id,
        to: r.growthMeasurements.patientId
      }),
      medicalRecords: r.many.medicalRecords({
        from: r.patients.id,
        to: r.medicalRecords.patientId
      }),
      admissions: r.many.admissions({
        from: r.patients.id,
        to: r.admissions.patientId
      }),
      labOrders: r.many.labOrders({
        from: r.patients.id,
        to: r.labOrders.patientId
      }),
      invoices: r.many.invoices({
        from: r.patients.id,
        to: r.invoices.patientId
      }),
      dispensations: r.many.dispensations({
        from: r.patients.id,
        to: r.dispensations.patientId
      })
    },

    guardians: {
      patient: r.one.patients({
        from: r.guardians.patientId,
        to: r.patients.id,
        optional: false
      }),
      user: r.one.user({
        from: r.guardians.userId,
        to: r.user.id
      })
    },

    patientAllergies: {
      patient: r.one.patients({
        from: r.patientAllergies.patientId,
        to: r.patients.id,
        optional: false
      })
    },

    patientChronicConditions: {
      patient: r.one.patients({
        from: r.patientChronicConditions.patientId,
        to: r.patients.id,
        optional: false
      })
    },

    patientDocuments: {
      patient: r.one.patients({
        from: r.patientDocuments.patientId,
        to: r.patients.id,
        optional: false
      }),
      uploader: r.one.user({
        from: r.patientDocuments.uploadedBy,
        to: r.user.id,
        optional: false
      })
    },

    // ============================================================
    // CLINICAL
    // ============================================================
    staff: {
      user: r.one.user({
        from: r.staff.userId,
        to: r.user.id,
        optional: false
      }),
      clinic: r.one.clinics({
        from: r.staff.clinicId,
        to: r.clinics.id
      }),
      // ✅ 1:1 doctor profile (only present when role === 'doctor')
      doctorProfile: r.one.doctors({
        from: r.staff.id,
        to: r.doctors.staffId
      }),
      patientsAsPediatrician: r.many.patients({
        from: r.staff.id,
        to: r.patients.pediatricianId
      }),
      // ✅ now correctly sourced
      prescriptionsAsPrescriber: r.many.prescriptions({
        from: r.staff.id,
        to: r.prescriptions.prescriberId
      }),
      uploadedMedicalRecords: r.many.medicalRecords({
        from: r.staff.id,
        to: r.medicalRecords.uploadedBy
      })
    },

    doctors: {
      // ✅ staff is the identity source
      staff: r.one.staff({
        from: r.doctors.staffId,
        to: r.staff.id,
        optional: false
      }),

      department: r.one.departments({
        from: r.doctors.departmentId,
        to: r.departments.id,
        optional: false
      }),
      schedules: r.many.doctorSchedules({
        from: r.doctors.id,
        to: r.doctorSchedules.doctorId
      }),
      appointments: r.many.appointments({
        from: r.doctors.id,
        to: r.appointments.doctorId
      }),
      encounters: r.many.encounters({
        from: r.doctors.id,
        to: r.encounters.doctorId
      }),
      prescriptions: r.many.prescriptions({
        from: r.doctors.id,
        to: r.prescriptions.doctorId
      }),
      admissions: r.many.admissions({
        from: r.doctors.id,
        to: r.admissions.attendingDoctorId
      }),
      labOrders: r.many.labOrders({
        from: r.doctors.id,
        to: r.labOrders.orderedByDoctorId
      })
    },

    doctorSchedules: {
      doctor: r.one.doctors({
        from: r.doctorSchedules.doctorId,
        to: r.doctors.id,
        optional: false
      })
    },

    appointments: {
      patient: r.one.patients({
        from: r.appointments.patientId,
        to: r.patients.id,
        optional: false
      }),
      doctor: r.one.doctors({
        from: r.appointments.doctorId,
        to: r.doctors.id,
        optional: false
      }),
      bookedByUser: r.one.user({
        from: r.appointments.bookedBy,
        to: r.user.id,
        optional: false
      }),
      encounter: r.one.encounters({
        from: r.appointments.id,
        to: r.encounters.appointmentId
      })
    },

    encounters: {
      patient: r.one.patients({
        from: r.encounters.patientId,
        to: r.patients.id,
        optional: false
      }),
      doctor: r.one.doctors({
        from: r.encounters.doctorId,
        to: r.doctors.id,
        optional: false
      }),
      appointment: r.one.appointments({
        from: r.encounters.appointmentId,
        to: r.appointments.id
      }),
      diagnoses: r.many.diagnoses({
        from: r.encounters.id,
        to: r.diagnoses.encounterId
      }),
      prescriptions: r.many.prescriptions({
        from: r.encounters.id,
        to: r.prescriptions.encounterId
      }),
      growthMeasurements: r.many.growthMeasurements({
        from: r.encounters.id,
        to: r.growthMeasurements.encounterId
      }),
      medicalRecords: r.many.medicalRecords({
        from: r.encounters.id,
        to: r.medicalRecords.encounterId
      }),
      labOrders: r.many.labOrders({
        from: r.encounters.id,
        to: r.labOrders.encounterId
      }),
      invoices: r.many.invoices({
        from: r.encounters.id,
        to: r.invoices.encounterId
      })
    },

    diagnoses: {
      encounter: r.one.encounters({
        from: r.diagnoses.encounterId,
        to: r.encounters.id,
        optional: false
      })
    },

    prescriptions: {
      encounter: r.one.encounters({
        from: r.prescriptions.encounterId,
        to: r.encounters.id,
        optional: false
      }),
      patient: r.one.patients({
        from: r.prescriptions.patientId,
        to: r.patients.id,
        optional: false
      }),
      doctor: r.one.doctors({
        from: r.prescriptions.doctorId,
        to: r.doctors.id,
        optional: false
      }),
      prescriber: r.one.staff({
        // ✅ was broken, now valid
        from: r.prescriptions.prescriberId,
        to: r.staff.id,
        optional: false
      }),
      items: r.many.prescriptionItems({
        from: r.prescriptions.id,
        to: r.prescriptionItems.prescriptionId
      }),
      dispensations: r.many.dispensations({
        from: r.prescriptions.id,
        to: r.dispensations.prescriptionId
      })
    },
    prescriptionItems: {
      prescription: r.one.prescriptions({
        from: r.prescriptionItems.prescriptionId,
        to: r.prescriptions.id,
        optional: false
      }),
      medicine: r.one.medicines({
        from: r.prescriptionItems.medicineId,
        to: r.medicines.id
      }),
      dispensationItems: r.many.dispensationItems({
        from: r.prescriptionItems.id,
        to: r.dispensationItems.prescriptionItemId
      })
    },

    growthMeasurements: {
      patient: r.one.patients({
        from: r.growthMeasurements.patientId,
        to: r.patients.id,
        optional: false
      }),
      encounter: r.one.encounters({
        from: r.growthMeasurements.encounterId,
        to: r.encounters.id
      })
    },

    // ============================================================
    // IMMUNIZATION
    // ============================================================
    immunizations: {
      patient: r.one.patients({
        from: r.immunizations.patientId,
        to: r.patients.id,
        optional: false
      })
    },

    whoGrowthData: {},

    medicalRecords: {
      patient: r.one.patients({
        from: r.medicalRecords.patientId,
        to: r.patients.id,
        optional: false
      }),
      encounter: r.one.encounters({
        from: r.medicalRecords.encounterId,
        to: r.encounters.id
      }),
      uploadedByStaff: r.one.staff({
        from: r.medicalRecords.uploadedBy,
        to: r.staff.id,
        optional: false
      })
    },

    // ============================================================
    // INPATIENT
    // ============================================================
    wards: {
      rooms: r.many.rooms({
        from: r.wards.id,
        to: r.rooms.wardId
      })
    },

    rooms: {
      ward: r.one.wards({
        from: r.rooms.wardId,
        to: r.wards.id,
        optional: false
      }),
      beds: r.many.beds({
        from: r.rooms.id,
        to: r.beds.roomId
      })
    },

    beds: {
      room: r.one.rooms({
        from: r.beds.roomId,
        to: r.rooms.id,
        optional: false
      }),
      bedAllocations: r.many.bedAllocations({
        from: r.beds.id,
        to: r.bedAllocations.bedId
      }),
      currentAllocation: r.one.bedAllocations({
        from: r.beds.id,
        to: r.bedAllocations.bedId,
        where: { endedAt: { isNull: true } }
      })
    },

    admissions: {
      patient: r.one.patients({
        from: r.admissions.patientId,
        to: r.patients.id,
        optional: false
      }),
      attendingDoctor: r.one.doctors({
        from: r.admissions.attendingDoctorId,
        to: r.doctors.id,
        optional: false
      }),
      createdByUser: r.one.user({
        from: r.admissions.createdBy,
        to: r.user.id,
        optional: false
      }),
      bedAllocations: r.many.bedAllocations({
        from: r.admissions.id,
        to: r.bedAllocations.admissionId
      }),
      currentBedAllocation: r.one.bedAllocations({
        from: r.admissions.id,
        to: r.bedAllocations.admissionId,
        where: { endedAt: { isNull: true } }
      }),
      clinicalNotes: r.many.clinicalNotes({
        from: r.admissions.id,
        to: r.clinicalNotes.admissionId
      }),
      labOrders: r.many.labOrders({
        from: r.admissions.id,
        to: r.labOrders.admissionId
      }),
      invoices: r.many.invoices({
        from: r.admissions.id,
        to: r.invoices.admissionId
      })
    },

    bedAllocations: {
      admission: r.one.admissions({
        from: r.bedAllocations.admissionId,
        to: r.admissions.id,
        optional: false
      }),
      bed: r.one.beds({
        from: r.bedAllocations.bedId,
        to: r.beds.id,
        optional: false
      }),
      allocatedByUser: r.one.user({
        from: r.bedAllocations.allocatedBy,
        to: r.user.id,
        optional: false
      }),
      endedByUser: r.one.user({
        from: r.bedAllocations.endedBy,
        to: r.user.id
      })
    },

    clinicalNotes: {
      admission: r.one.admissions({
        from: r.clinicalNotes.admissionId,
        to: r.admissions.id,
        optional: false
      }),
      author: r.one.user({
        from: r.clinicalNotes.authorUserId,
        to: r.user.id,
        optional: false
      })
    },

    // ============================================================
    // LABORATORY
    // ============================================================
    labTests: {
      labOrderItems: r.many.labOrderItems({
        from: r.labTests.id,
        to: r.labOrderItems.labTestId
      })
    },

    labOrders: {
      patient: r.one.patients({
        from: r.labOrders.patientId,
        to: r.patients.id,
        optional: false
      }),
      encounter: r.one.encounters({
        from: r.labOrders.encounterId,
        to: r.encounters.id
      }),
      admission: r.one.admissions({
        from: r.labOrders.admissionId,
        to: r.admissions.id
      }),
      orderedByDoctor: r.one.doctors({
        from: r.labOrders.orderedByDoctorId,
        to: r.doctors.id,
        optional: false
      }),
      items: r.many.labOrderItems({
        from: r.labOrders.id,
        to: r.labOrderItems.labOrderId
      })
    },

    labOrderItems: {
      labOrder: r.one.labOrders({
        from: r.labOrderItems.labOrderId,
        to: r.labOrders.id,
        optional: false
      }),
      labTest: r.one.labTests({
        from: r.labOrderItems.labTestId,
        to: r.labTests.id,
        optional: false
      }),
      resultedByUser: r.one.user({
        from: r.labOrderItems.resultedByUserId,
        to: r.user.id
      })
    },

    // ============================================================
    // BILLING
    // ============================================================
    chargeCatalog: {},

    invoices: {
      patient: r.one.patients({
        from: r.invoices.patientId,
        to: r.patients.id,
        optional: false
      }),
      encounter: r.one.encounters({
        from: r.invoices.encounterId,
        to: r.encounters.id
      }),
      admission: r.one.admissions({
        from: r.invoices.admissionId,
        to: r.admissions.id
      }),
      createdByUser: r.one.user({
        from: r.invoices.createdBy,
        to: r.user.id,
        optional: false
      }),
      items: r.many.invoiceItems({
        from: r.invoices.id,
        to: r.invoiceItems.invoiceId
      }),
      payments: r.many.payments({
        from: r.invoices.id,
        to: r.payments.invoiceId
      })
    },

    invoiceItems: {
      invoice: r.one.invoices({
        from: r.invoiceItems.invoiceId,
        to: r.invoices.id,
        optional: false
      })
    },

    payments: {
      invoice: r.one.invoices({
        from: r.payments.invoiceId,
        to: r.invoices.id,
        optional: false
      }),
      receivedByUser: r.one.user({
        from: r.payments.receivedBy,
        to: r.user.id,
        optional: false
      })
    },

    expenses: {
      recordedByUser: r.one.user({
        from: r.expenses.recordedBy,
        to: r.user.id,
        optional: false
      })
    },

    // ============================================================
    // PHARMACY
    // ============================================================
    medicines: {
      batches: r.many.medicineBatches({
        from: r.medicines.id,
        to: r.medicineBatches.medicineId
      }),
      inventoryTransactions: r.many.inventoryTransactions({
        from: r.medicines.id,
        to: r.inventoryTransactions.medicineId
      }),
      prescriptionItems: r.many.prescriptionItems({
        from: r.medicines.id,
        to: r.prescriptionItems.medicineId
      }),
      dispensationItems: r.many.dispensationItems({
        from: r.medicines.id,
        to: r.dispensationItems.medicineId
      })
    },

    medicineBatches: {
      medicine: r.one.medicines({
        from: r.medicineBatches.medicineId,
        to: r.medicines.id,
        optional: false
      }),
      inventoryTransactions: r.many.inventoryTransactions({
        from: r.medicineBatches.id,
        to: r.inventoryTransactions.batchId
      }),
      dispensationItems: r.many.dispensationItems({
        from: r.medicineBatches.id,
        to: r.dispensationItems.batchId
      })
    },

    inventoryTransactions: {
      medicine: r.one.medicines({
        from: r.inventoryTransactions.medicineId,
        to: r.medicines.id,
        optional: false
      }),
      batch: r.one.medicineBatches({
        from: r.inventoryTransactions.batchId,
        to: r.medicineBatches.id
      }),
      performedByUser: r.one.user({
        from: r.inventoryTransactions.performedBy,
        to: r.user.id,
        optional: false
      })
    },

    dispensations: {
      prescription: r.one.prescriptions({
        from: r.dispensations.prescriptionId,
        to: r.prescriptions.id,
        optional: false
      }),
      patient: r.one.patients({
        from: r.dispensations.patientId,
        to: r.patients.id,
        optional: false
      }),
      dispensedByUser: r.one.user({
        from: r.dispensations.dispensedBy,
        to: r.user.id,
        optional: false
      }),
      items: r.many.dispensationItems({
        from: r.dispensations.id,
        to: r.dispensationItems.dispensationId
      })
    },

    dispensationItems: {
      dispensation: r.one.dispensations({
        from: r.dispensationItems.dispensationId,
        to: r.dispensations.id,
        optional: false
      }),
      prescriptionItem: r.one.prescriptionItems({
        from: r.dispensationItems.prescriptionItemId,
        to: r.prescriptionItems.id,
        optional: false
      }),
      medicine: r.one.medicines({
        from: r.dispensationItems.medicineId,
        to: r.medicines.id,
        optional: false
      }),
      batch: r.one.medicineBatches({
        from: r.dispensationItems.batchId,
        to: r.medicineBatches.id,
        optional: false
      })
    }
  };
});
