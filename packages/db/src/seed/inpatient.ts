import { faker } from "@faker-js/faker";

// src/db/seeds/seed-wards.ts
import { type doctors } from "#@/schema/clinical";
import { type patients } from "#@/schema/index";
import { admissions, bedAllocations, beds, clinicalNotes, rooms, wards } from "#@/schema/inpatient";
import { daysAgo, daysFromNow, ids, pick, randFloat, randInt, seedDb } from "#@/seed/helper";

const WARD_DEFS = [
  { name: "Pediatric General Ward A", type: "Pediatric" },
  { name: "Pediatric General Ward B", type: "Pediatric" },
  { name: "Neonatal Intensive Care (NICU)", type: "NICU" },
  { name: "Pediatric Intensive Care (PICU)", type: "PICU" },
  { name: "Pediatric Isolation Unit", type: "Isolation" }
];

const ROOM_TYPES = ["Private", "Semi-Private", "Ward", "Isolation"] as const;

export async function seedWards() {
  const wardRows = await seedDb
    .insert(wards)
    .values(
      WARD_DEFS.map((w, i) => {
        return {
          code: ids.wardCode(i + 1),
          name: w.name,
          type: w.type,
          isActive: true
        };
      })
    )
    .returning();

  const roomRows: (typeof rooms.$inferInsert)[] = [];
  for (const ward of wardRows) {
    const roomCount = ward.type === "NICU" ? 8 : ward.type === "PICU" ? 6 : 10;
    for (let r = 1; r <= roomCount; r++) {
      const roomType =
        ward.type === "Isolation"
          ? "Isolation"
          : ward.type === "NICU" || ward.type === "PICU"
            ? "Private"
            : pick(ROOM_TYPES);

      roomRows.push({
        wardId: ward.id,
        roomNumber: `${ward.code}-R${String(r).padStart(2, "0")}`,
        roomType,
        dailyRate: randFloat(150, 1200, 2).toFixed(2),
        isActive: true
      });
    }
  }

  const insertedRooms = await seedDb.insert(rooms).values(roomRows).returning();

  const bedRows: (typeof beds.$inferInsert)[] = [];
  for (const room of insertedRooms) {
    const bedCount = room.roomType === "Ward" ? 4 : room.roomType === "Semi-Private" ? 2 : 1;
    for (let b = 1; b <= bedCount; b++) {
      bedRows.push({
        roomId: room.id,
        bedNumber: `${room.roomNumber}-B${b}`,
        status: "available",
        isActive: true
      });
    }
  }

  const insertedBeds = await seedDb.insert(beds).values(bedRows).returning();

  return { wards: wardRows, rooms: insertedRooms, beds: insertedBeds };
}
const ADMISSION_REASONS = [
  "Acute bronchiolitis requiring oxygen",
  "Dehydration secondary to gastroenteritis",
  "Severe asthma exacerbation",
  "Febrile neutropenia",
  "Neonatal jaundice requiring phototherapy",
  "Sepsis rule-out",
  "Post-operative observation",
  "Status epilepticus",
  "Diabetic ketoacidosis",
  "Pneumonia with respiratory distress"
];

const CLINICAL_NOTE_TYPES = [
  "Progress",
  "Admission",
  "Discharge",
  "Consultation",
  "Nursing",
  "Procedure",
  "Other"
] as const;

type PatientRow = typeof patients.$inferSelect;
type DoctorRow = typeof doctors.$inferSelect;
type BedRow = typeof beds.$inferSelect;

export async function seedAdmissions(args: {
  patients: PatientRow[];
  doctors: DoctorRow[];
  beds: BedRow[];
  createdBy: string;
}) {
  const { patients, doctors, beds, createdBy } = args;

  const availableBeds = [...beds];

  const admissionRows: (typeof admissions.$inferInsert)[] = [];
  const allocationRows: (typeof bedAllocations.$inferInsert)[] = [];
  const noteRows: (typeof clinicalNotes.$inferInsert)[] = [];

  const admissionCount = 25;
  const usedPatients = new Set<string>();

  for (let i = 1; i <= admissionCount; i++) {
    let patient: PatientRow;
    do {
      patient = pick(patients);
    } while (usedPatients.has(patient.id) && usedPatients.size < patients.length);
    usedPatients.add(patient.id);

    const doctor = pick(doctors);
    const bed = availableBeds.pop();
    if (!bed) break;

    // 60% currently admitted, 40% already discharged
    const currentlyAdmitted = Math.random() < 0.6;

    const admittedAt = currentlyAdmitted ? daysAgo(randInt(1, 20)) : daysAgo(randInt(20, 120));

    const dischargedAt = currentlyAdmitted
      ? null
      : new Date(admittedAt.getTime() + randInt(2, 14) * 86_400_000);

    const [admission] = await seedDb
      .insert(admissions)
      .values({
        admissionNumber: ids.admissionNumber(i),
        patientId: patient.id,
        attendingDoctorId: doctor.id,
        status: currentlyAdmitted ? "admitted" : "discharged",
        admissionReason: pick(ADMISSION_REASONS),
        admittedAt,
        expectedDischargeAt: daysFromNow(randInt(1, 10)),
        dischargedAt,
        dischargeSummary: dischargedAt
          ? `Patient discharged in stable condition after ${randInt(2, 14)} day stay. Parental education provided on home care and follow-up schedule.`
          : null,
        createdBy
      })
      .returning();

    admissionRows.push(admission);

    // Bed allocation
    allocationRows.push({
      admissionId: admission.id,
      bedId: bed.id,
      startedAt: admittedAt,
      endedAt: dischargedAt,
      allocatedBy: createdBy,
      endedBy: dischargedAt ? createdBy : null,
      transferReason: null
    });

    // 2-6 clinical notes per admission
    const noteCount = randInt(2, 6);
    for (let n = 0; n < noteCount; n++) {
      const noteTime = new Date(admittedAt.getTime() + n * randInt(6, 24) * 3_600_000);
      if (dischargedAt && noteTime > dischargedAt) break;

      noteRows.push({
        admissionId: admission.id,
        authorUserId: createdBy,
        noteType: pick(CLINICAL_NOTE_TYPES),
        noteText: faker.lorem.sentences(randInt(2, 5))
      });
    }
  }

  if (allocationRows.length > 0) {
    await seedDb.insert(bedAllocations).values(allocationRows);
  }
  if (noteRows.length > 0) {
    await seedDb.insert(clinicalNotes).values(noteRows);
  }

  return {
    admissionCount: admissionRows.length,
    allocationCount: allocationRows.length,
    noteCount: noteRows.length
  };
}
