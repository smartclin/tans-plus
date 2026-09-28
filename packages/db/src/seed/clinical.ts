// src/db/seeds/seed-encounters.ts
import { faker } from "@faker-js/faker";

import {
  appointments,
  diagnoses,
  doctors,
  doctorSchedules,
  encounters,
  growthMeasurements,
  prescriptionItems,
  prescriptions,
  staff
} from "#@/schema/clinical";
import {
  approximateHeadCirc,
  approximateHeight,
  approximateWeight,
  type ClinicRow,
  daysAgo,
  daysFromNow,
  type DepartmentRow,
  type DoctorRow,
  encounterNumber,
  type EncounterRow,
  ids,
  monthsBetween,
  type NewGrowthMeasurementRow,
  type NewPrescriptionItemRow,
  type PatientRow,
  pick,
  prescriptionNumber,
  type PrescriptionRow,
  randFloat,
  randInt,
  seedDb,
  type StaffRow,
  type UserRow
} from "#@/seed/helper";

const CHIEF_COMPLAINTS = [
  "Fever for 3 days",
  "Persistent cough and wheezing",
  "Abdominal pain with vomiting",
  "Rash on trunk and extremities",
  "Ear pain, right side",
  "Sore throat and difficulty swallowing",
  "Diarrhea and dehydration",
  "Headache with light sensitivity",
  "Shortness of breath on exertion",
  "Joint pain and swelling",
  "Routine well-child visit",
  "Follow-up for asthma management"
];

const TEMPERATURE_METHODS = ["Axillary", "Oral", "Rectal", "Tympanic", "Temporal"] as const;
const PAIN_SCALE_TYPES = ["Wong-Baker", "Numeric", "FLACC", "Neonatal"] as const;

type AppointmentRow = typeof appointments.$inferSelect;

// ─── Constants ────────────────────────────────────────────────
const SPECIALIZATIONS = [
  "General Pediatrics",
  "Neonatology",
  "Pediatric Cardiology",
  "Pediatric Neurology",
  "Pediatric Pulmonology",
  "Pediatric Gastroenterology",
  "Pediatric Endocrinology",
  "Pediatric Emergency Medicine",
  "Pediatric Surgery",
  "Pediatric Dermatology"
];

const TITLES = ["Dr.", "Dr.", "Dr.", "Dr.", "Prof."] as const;

const AVATAR_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899"
] as const;

const QUALIFICATIONS = ["MD", "MD, FAAP", "MBBS, DCH", "MD, PhD", "DO", "MBBS, MD"] as const;

const SUPPORT_STAFF_ROLES = [
  { title: "Sr.", role: "staff" as const, specialty: "Nursing", department: "General" },
  { title: "Sr.", role: "staff" as const, specialty: "Reception", department: "General" },
  { title: "Sr.", role: "staff" as const, specialty: "Pharmacy", department: "General" },
  { title: "Sr.", role: "staff" as const, specialty: "Laboratory", department: "General" },
  { title: "Sr.", role: "staff" as const, specialty: "Billing", department: "General" }
] as const;

// ─── Main seed ────────────────────────────────────────────────
export async function seedStaffAndDoctors(args: {
  users: UserRow[];
  clinics: ClinicRow[];
  departments: DepartmentRow[];
}) {
  const { users, clinics, departments } = args;

  if (users.length < 20) {
    throw new Error(`seed-staff requires at least 20 users, got ${users.length}`);
  }
  if (clinics.length === 0) {
    throw new Error("seed-staff requires at least one clinic");
  }
  if (departments.length === 0) {
    throw new Error("seed-staff requires at least one department");
  }

  const mainClinic = clinics[0];

  // ─── 15 doctor staff rows ─────────────────────────────────
  const doctorUsers = users.slice(0, 15);
  const doctorStaffPayload: (typeof staff.$inferInsert)[] = doctorUsers.map((u) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    return {
      name: `${pick(TITLES)} ${firstName} ${lastName}`,
      title: pick(TITLES),
      role: "doctor",
      licenseNumber: `LIC-${faker.string.numeric(8)}`,
      avatarColor: pick(AVATAR_COLORS),
      pinHash: "$2b$10$placeholderPinHashForSeeding",
      clinicId: mainClinic.id,
      phone: u.phone,
      bio: faker.lorem.sentences(2),
      userId: u.id,
      email: u.email,
      isActive: true,
      specialty: pick(SPECIALIZATIONS),
      department: pick(SPECIALIZATIONS)
    };
  });

  // ─── 5 support staff rows ─────────────────────────────────
  const supportUsers = users.slice(15, 20);
  const supportStaffPayload: (typeof staff.$inferInsert)[] = supportUsers.map((u, idx) => {
    const def = SUPPORT_STAFF_ROLES[idx % SUPPORT_STAFF_ROLES.length];
    return {
      name: faker.person.fullName(),
      title: def.title,
      role: def.role,
      licenseNumber: `LIC-${faker.string.numeric(8)}`,
      avatarColor: pick(AVATAR_COLORS),
      pinHash: "$2b$10$placeholderPinHashForSeeding",
      clinicId: mainClinic.id,
      phone: u.phone,
      bio: faker.lorem.sentence(),
      userId: u.id,
      email: u.email,
      isActive: true,
      specialty: def.specialty,
      department: def.department
    };
  });

  const staffRows = await seedDb
    .insert(staff)
    .values([...doctorStaffPayload, ...supportStaffPayload])
    .returning();

  // ─── Doctor profile rows (1:1 with doctor staff) ──────────
  const doctorStaffRows = staffRows.filter((s) => s.role === "doctor");

  const doctorRows = await seedDb
    .insert(doctors)
    .values(
      doctorStaffRows.map((s, i) => {
        return {
          staffId: s.id,
          departmentId: pick(departments).id,
          doctorCode: ids.doctorCode(i + 1),
          registrationNumber: ids.registrationNumber(i + 1),
          specialization: s.specialty ?? "General Pediatrics",
          qualification: pick(QUALIFICATIONS),
          consultationFee: randFloat(80, 350, 2).toFixed(2),
          isActive: true
        };
      })
    )
    .returning();

  // ─── Doctor schedules (Mon–Fri, 3 blocks per doctor) ──────
  const scheduleRows: (typeof doctorSchedules.$inferInsert)[] = [];

  for (const doctor of doctorRows) {
    // Each doctor works 4–5 days/week
    const workingDays = faker.helpers.arrayElements([1, 2, 3, 4, 5], randInt(4, 5));

    for (const day of workingDays) {
      // Morning block
      scheduleRows.push({
        doctorId: doctor.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "12:00",
        slotDurationMinutes: pick([15, 20, 30]),
        isActive: true
      });

      // Afternoon block (not everyone works afternoons)
      if (Math.random() < 0.7) {
        scheduleRows.push({
          doctorId: doctor.id,
          dayOfWeek: day,
          startTime: "14:00",
          endTime: "17:00",
          slotDurationMinutes: pick([15, 20, 30]),
          isActive: true
        });
      }

      // Evening block (fewer doctors)
      if (Math.random() < 0.25) {
        scheduleRows.push({
          doctorId: doctor.id,
          dayOfWeek: day,
          startTime: "18:00",
          endTime: "20:00",
          slotDurationMinutes: pick([20, 30]),
          isActive: true
        });
      }
    }
  }

  await seedDb.insert(doctorSchedules).values(scheduleRows);

  return {
    staffRows,
    doctorRows,
    doctorStaffRows,
    supportStaffRows: staffRows.filter((s) => s.role !== "doctor"),
    scheduleCount: scheduleRows.length
  };
}

// ─── Constants ────────────────────────────────────────────────
const VISIT_TYPES = [
  "Well-Child Check",
  "Sick Visit",
  "Follow-Up",
  "Immunization Visit",
  "Consultation",
  "Lactation Consultation",
  "Emergency/Urgent",
  "Telehealth",
  "Other"
] as const;

const REASONS = [
  "Routine well-child check",
  "Fever for 2 days",
  "Persistent cough and wheezing",
  "Vaccination — routine schedule",
  "Follow-up on asthma management",
  "Ear pain, right side",
  "Rash on trunk and extremities",
  "Abdominal pain with vomiting",
  "Developmental screening",
  "Nutritional consultation",
  "Sore throat and difficulty swallowing",
  "Diarrhea and dehydration concerns",
  "Follow-up on lab results",
  "Annual physical examination",
  "Behavioral concerns — parent initiated"
];

const PRIORITIES = ["Normal", "Normal", "Normal", "Normal", "Urgent", "Emergency"] as const;

// ─── Main seed ────────────────────────────────────────────────
export async function seedAppointments(args: {
  patients: PatientRow[];
  doctors: DoctorRow[];
  bookedBy: string;
}) {
  const { patients, doctors, bookedBy } = args;

  if (patients.length === 0) {
    throw new Error("seed-appointments requires at least one patient");
  }
  if (doctors.length === 0) {
    throw new Error("seed-appointments requires at least one doctor");
  }
  if (!bookedBy) {
    throw new Error("seed-appointments requires bookedBy (user.id)");
  }

  const rows: (typeof appointments.$inferInsert)[] = [];

  // ─── 180 appointments: past / today / future ──────────────
  for (let i = 1; i <= 180; i++) {
    const patient = pick(patients);
    const doctor = pick(doctors);

    // Distribution: 65% past (-180..-1), 10% today, 25% future (+1..+45)
    const roll = Math.random();
    const dayOffset = roll < 0.65 ? -randInt(1, 180) : roll < 0.75 ? 0 : randInt(1, 45);

    const scheduledStart =
      dayOffset < 0 ? daysAgo(-dayOffset) : dayOffset === 0 ? new Date() : daysFromNow(dayOffset);

    // Business hours: 08:00 – 18:00 in 15-min slots
    scheduledStart.setHours(randInt(8, 17), pick([0, 15, 30, 45]), 0, 0);

    const durationMinutes = pick([15, 20, 30, 45, 60]);
    const scheduledEnd = new Date(scheduledStart.getTime() + durationMinutes * 60_000);

    // ─── Status depends on temporal position ──────────────
    let status: (typeof appointments.$inferSelect)["status"];

    if (dayOffset < 0) {
      // Past: mostly completed, some no_show / cancelled
      const s = Math.random();
      status = s < 0.82 ? "completed" : s < 0.92 ? "no_show" : "cancelled";
    } else if (dayOffset === 0) {
      // Today: mixed
      status = pick(["scheduled", "checked_in", "in_progress", "completed", "no_show"]);
    } else {
      // Future: scheduled
      status = "scheduled";
    }

    // ─── Timestamp progression ────────────────────────────
    const checkedInAt =
      status !== "scheduled" && status !== "cancelled" && status !== "no_show"
        ? new Date(scheduledStart.getTime() - randInt(5, 30) * 60_000)
        : null;

    const startedAt =
      status === "in_progress" || status === "completed"
        ? new Date(scheduledStart.getTime() + randInt(-5, 15) * 60_000)
        : null;

    const completedAt =
      status === "completed" && startedAt
        ? new Date(startedAt.getTime() + randInt(10, 50) * 60_000)
        : null;

    rows.push({
      appointmentNumber: ids.appointmentNumber(i),
      patientId: patient.id,
      doctorId: doctor.id,
      scheduledStart,
      scheduledEnd,
      status,
      reason: pick(REASONS),
      type: pick(VISIT_TYPES),
      priority: pick(PRIORITIES),
      notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.35 }) ?? null,
      bookedBy,
      cancellationReason:
        status === "cancelled"
          ? pick([
              "Patient rescheduled",
              "Patient no longer needs visit",
              "Doctor unavailable",
              "Weather emergency"
            ])
          : null,
      checkedInAt,
      startedAt,
      completedAt
    });
  }

  // ─── Chunked insert (avoids PG parameter limit) ───────────
  const chunkSize = 100;
  const inserted: (typeof appointments.$inferSelect)[] = [];

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = await seedDb
      .insert(appointments)
      .values(rows.slice(i, i + chunkSize))
      .returning();
    inserted.push(...chunk);
  }

  // ─── Summary stats for logging ────────────────────────────
  const statusCounts = inserted.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    appointments: inserted,
    statusCounts
  };
}
export async function seedEncounters(args: {
  patients: PatientRow[];
  doctors: DoctorRow[];
  appointments: AppointmentRow[];
}) {
  const { patients, doctors, appointments } = args;

  // Only use completed appointments (real visits happened)
  const completedAppointments = appointments.filter((a) => a.status === "completed");

  const encounterRows: EncounterRow[] = [];
  const diagnosisRows: (typeof diagnoses.$inferInsert)[] = [];

  const DIAGNOSIS_POOL = [
    { code: "J06.9", description: "Acute upper respiratory infection" },
    { code: "J45.909", description: "Unspecified asthma, uncomplicated" },
    { code: "K52.9", description: "Noninfective gastroenteritis" },
    { code: "L20.9", description: "Atopic dermatitis, unspecified" },
    { code: "H66.90", description: "Otitis media, unspecified" },
    { code: "J02.9", description: "Acute pharyngitis, unspecified" },
    { code: "A09", description: "Infectious gastroenteritis" },
    { code: "R51.9", description: "Headache, unspecified" },
    { code: "M25.50", description: "Pain in unspecified joint" },
    { code: "Z00.129", description: "Routine child health exam" }
  ];

  let counter = 1;
  for (const apt of completedAppointments) {
    const patient = patients.find((p) => p.id === apt.patientId);
    const doctor = doctors.find((d) => d.id === apt.doctorId);
    if (!patient || !doctor) continue;

    const startedAt = apt.startedAt ?? apt.scheduledStart;
    const completedAt = apt.completedAt ?? new Date(startedAt.getTime() + 30 * 60_000);

    const weightKg = randFloat(3.2, 65, 2);
    const heightCm = randFloat(50, 170, 1);
    const bmi = Number((weightKg / Math.pow(heightCm / 100, 2)).toFixed(1));

    const [encounter] = await seedDb
      .insert(encounters)
      .values({
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentId: apt.id,
        encounterNumber: encounterNumber(counter),
        status: "completed",
        chiefComplaint: pick(CHIEF_COMPLAINTS),
        history: faker.lorem.sentences(2),
        examinationNotes: faker.lorem.sentences(3),
        diagnosisSummary: faker.lorem.sentence(),
        temperatureC: randFloat(36.2, 39.5, 1),
        temperatureMethod: pick(TEMPERATURE_METHODS),
        systolicBp: randInt(85, 130),
        diastolicBp: randInt(55, 85),
        oxygenSaturationPercent: randInt(92, 100),
        painScore: randInt(0, 8),
        painScaleType: pick(PAIN_SCALE_TYPES),
        weightKg,
        heightCm,
        headCircumferenceCm:
          patient.dateOfBirth && new Date(patient.dateOfBirth) > daysAgo(730)
            ? randFloat(32, 52, 1)
            : null,
        bmi,
        notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.4 }),
        treatmentPlan: faker.lorem.sentences(2),
        followUpAt: faker.helpers.maybe(() => daysFromNow(randInt(3, 30)), { probability: 0.5 }),
        startedAt,
        completedAt
      })
      .returning();

    encounterRows.push(encounter);

    // 1-3 diagnoses per encounter
    const diagnosisCount = randInt(1, 3);
    const selectedDiagnoses = faker.helpers.arrayElements(DIAGNOSIS_POOL, diagnosisCount);
    selectedDiagnoses.forEach((dx, idx) => {
      diagnosisRows.push({
        encounterId: encounter.id,
        code: dx.code,
        description: dx.description,
        isPrimary: idx === 0
      });
    });

    counter++;
  }

  if (diagnosisRows.length > 0) {
    await seedDb.insert(diagnoses).values(diagnosisRows);
  }

  return { encounters: encounterRows, diagnosisCount: diagnosisRows.length };
}
// src/db/seeds/seed-prescriptions.ts

const MEDICATIONS = [
  { name: "Amoxicillin", dosage: "250mg/5ml", form: "oral suspension" },
  { name: "Ibuprofen", dosage: "100mg/5ml", form: "oral suspension" },
  { name: "Acetaminophen", dosage: "160mg/5ml", form: "oral suspension" },
  { name: "Cetirizine", dosage: "5mg/5ml", form: "oral solution" },
  { name: "Albuterol", dosage: "2.5mg/3ml", form: "nebulizer solution" },
  { name: "Prednisolone", dosage: "15mg/5ml", form: "oral solution" },
  { name: "Ondansetron", dosage: "4mg/5ml", form: "oral solution" },
  { name: "Cefdinir", dosage: "250mg/5ml", form: "oral suspension" },
  { name: "Montelukast", dosage: "4mg", form: "chewable tablet" },
  { name: "Fluticasone", dosage: "50mcg", form: "nasal spray" }
];

const FREQUENCIES = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Four times daily",
  "Every 6 hours as needed",
  "Every 4-6 hours as needed"
];

const ROUTES = ["oral", "oral", "oral", "intranasal", "inhalation"];
const DURATIONS = ["3 days", "5 days", "7 days", "10 days", "14 days", "30 days"];
const INSTRUCTIONS = [
  "Take with food",
  "Take on an empty stomach",
  "Shake well before use",
  "Complete full course",
  "Discontinue if rash appears",
  "Refrigerate after opening"
];

export async function seedPrescriptions(args: {
  encounters: EncounterRow[];
  doctors: DoctorRow[];
  staffRows: StaffRow[];
}) {
  const { encounters: encounterRows, doctors, staffRows } = args;

  const doctorStaff = staffRows.filter((s) => s.role === "doctor");
  if (doctorStaff.length === 0) {
    return { prescriptionCount: 0 };
  }

  const prescriptionRows: PrescriptionRow[] = [];
  const itemRows: NewPrescriptionItemRow[] = [];

  let counter = 1;
  for (const encounter of encounterRows) {
    // ~70% of encounters produce a prescription
    if (Math.random() > 0.7) continue;

    const doctor = doctors.find((d) => d.id === encounter.doctorId);
    if (!doctor) continue;

    const prescriber = doctorStaff.find((s) => s.id === doctor.staffId) ?? pick(doctorStaff);

    const [rx] = await seedDb
      .insert(prescriptions)
      .values({
        prescriptionNumber: prescriptionNumber(counter),
        encounterId: encounter.id,
        patientId: encounter.patientId,
        doctorId: encounter.doctorId,
        prescriberId: prescriber.id,
        status: "active",
        prescriberName: prescriber.name,
        prescriberLicense: prescriber.licenseNumber,
        patientWeightKg: encounter.weightKg ?? 15.0,
        diagnosis: encounter.diagnosisSummary,
        notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
        prescribedAt: encounter.completedAt ?? encounter.startedAt
      })
      .returning();

    prescriptionRows.push(rx);

    // 1-4 items per prescription
    const itemCount = randInt(1, 4);
    const selectedMeds = faker.helpers.arrayElements(MEDICATIONS, itemCount);
    for (const med of selectedMeds) {
      itemRows.push({
        prescriptionId: rx.id,
        medicineId: null, // catalog linkage not required for seed
        medicineNameSnapshot: `${med.name} ${med.dosage} (${med.form})`,
        dosage: med.dosage,
        route: pick(ROUTES),
        frequency: pick(FREQUENCIES),
        duration: pick(DURATIONS),
        quantity: randInt(1, 60),
        instructions: pick(INSTRUCTIONS)
      });
    }

    counter++;
  }

  if (itemRows.length > 0) {
    await seedDb.insert(prescriptionItems).values(itemRows);
  }

  return { prescriptionCount: prescriptionRows.length, itemCount: itemRows.length };
}

export async function seedGrowthMeasurements(args: { patients: PatientRow[]; recordedBy: string }) {
  const { patients, recordedBy } = args;

  const rows: NewGrowthMeasurementRow[] = [];

  for (const patient of patients) {
    const ageMonths = monthsBetween(new Date(patient.dateOfBirth), new Date());
    if (ageMonths < 1) continue;

    // 2-6 measurements per patient
    const count = randInt(2, 6);

    // Distribute measurements across the patient's life
    const measurementAges: number[] = [];
    for (let i = 0; i < count; i++) {
      measurementAges.push(randInt(0, ageMonths));
    }
    measurementAges.sort((a, b) => a - b);

    for (const ageM of measurementAges) {
      const recordedAt = new Date(patient.dateOfBirth);
      recordedAt.setMonth(recordedAt.getMonth() + ageM);
      recordedAt.setDate(recordedAt.getDate() + randInt(-3, 3));
      if (recordedAt > new Date()) continue;

      // Approximate realistic values by age
      const weightKg = approximateWeight(ageM);
      const heightCm = approximateHeight(ageM);
      const headCirc = ageM < 36 ? approximateHeadCirc(ageM) : null;
      const bmi = Number((weightKg / Math.pow(heightCm / 100, 2)).toFixed(1));

      rows.push({
        patientId: patient.id,
        encounterId: null,
        recordedAt,
        ageMonths: ageM,
        ageDays: ageM * 30,
        weightKg,
        heightCm,
        headCircumferenceCm: headCirc,
        bmi,
        weightForAgeZScore: randFloat(-2.5, 2.5, 2),
        weightForAgePercentile: randFloat(1, 99, 1),
        heightForAgeZScore: randFloat(-2.5, 2.5, 2),
        heightForAgePercentile: randFloat(1, 99, 1),
        bmiForAgeZScore: randFloat(-2.5, 2.5, 2),
        bmiForAgePercentile: randFloat(1, 99, 1),
        headCircumferenceZScore: headCirc ? randFloat(-2.5, 2.5, 2) : null,
        headCircumferencePercentile: headCirc ? randFloat(1, 99, 1) : null,
        weightVelocity: null,
        heightVelocity: null,
        recordedBy,
        notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.2 })
      });
    }
  }

  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    await seedDb.insert(growthMeasurements).values(rows.slice(i, i + chunkSize));
  }

  return rows.length;
}
