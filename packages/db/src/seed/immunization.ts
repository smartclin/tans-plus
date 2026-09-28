// src/db/seeds/seed-immunizations.ts
import { faker } from "@faker-js/faker";

import { immunizations } from "#@/schema/immunization";
import { type patients } from "#@/schema/patients";
import { dateStr, daysFromNow, pick, randInt, seedDb } from "#@/seed/helper";

const VACCINE_SCHEDULE = [
  { code: "HEP-B-1", name: "Hepatitis B", disease: "Hepatitis B", ageMonths: 0, total: 3 },
  { code: "DTaP-1", name: "DTaP", disease: "Diphtheria/Tetanus/Pertussis", ageMonths: 2, total: 5 },
  { code: "IPV-1", name: "IPV", disease: "Poliovirus", ageMonths: 2, total: 4 },
  { code: "HIB-1", name: "Hib", disease: "Haemophilus influenzae type b", ageMonths: 2, total: 4 },
  { code: "PCV13-1", name: "PCV13", disease: "Pneumococcal", ageMonths: 2, total: 4 },
  { code: "ROTA-1", name: "Rotavirus", disease: "Rotavirus", ageMonths: 2, total: 3 },
  { code: "MMR-1", name: "MMR", disease: "Measles/Mumps/Rubella", ageMonths: 12, total: 2 },
  { code: "VAR-1", name: "Varicella", disease: "Varicella", ageMonths: 12, total: 2 },
  { code: "HEP-A-1", name: "Hepatitis A", disease: "Hepatitis A", ageMonths: 12, total: 2 },
  { code: "FLU-1", name: "Influenza", disease: "Influenza", ageMonths: 6, total: 1 }
];

const IMMUNIZATION_STATUSES = [
  "Administered",
  "Due",
  "Overdue",
  "Upcoming",
  "Deferred",
  "Refused"
] as const;
const ADMIN_SITES = ["Left thigh", "Right thigh", "Left arm", "Right arm", "Oral"];
const ADMIN_ROUTES = ["Intramuscular", "Subcutaneous", "Oral", "Intranasal"];
const MANUFACTURERS = ["Merck", "Pfizer", "GSK", "Sanofi Pasteur", "AstraZeneca"];

type PatientRow = typeof patients.$inferSelect;

export async function seedImmunizations(args: { patients: PatientRow[]; adminUserId: string }) {
  const { patients, adminUserId } = args;

  const rows: (typeof immunizations.$inferInsert)[] = [];

  for (const patient of patients) {
    const ageMonths = monthsBetween(new Date(patient.dateOfBirth), new Date());

    for (const vaccine of VACCINE_SCHEDULE) {
      // Skip vaccines scheduled for older kids than this patient
      if (vaccine.ageMonths > ageMonths) continue;

      const isOverdue = ageMonths > vaccine.ageMonths + 3 && Math.random() < 0.15;
      const isDue = !isOverdue && Math.random() < 0.25;
      const isAdministered = !isOverdue && !isDue && Math.random() < 0.85;

      const status: (typeof IMMUNIZATION_STATUSES)[number] = isOverdue
        ? "Overdue"
        : isDue
          ? "Due"
          : isAdministered
            ? "Administered"
            : pick(["Upcoming", "Deferred", "Refused"]);

      const dueDate = new Date(patient.dateOfBirth);
      dueDate.setMonth(dueDate.getMonth() + vaccine.ageMonths);

      const administeredDate =
        status === "Administered"
          ? dateStr(
              faker.date.between({
                from: dueDate,
                to: new Date(Math.min(dueDate.getTime() + 30 * 86_400_000, Date.now()))
              })
            )
          : null;

      rows.push({
        patientId: patient.id,
        vaccineCode: vaccine.code,
        vaccineName: vaccine.name,
        targetDisease: vaccine.disease,
        doseNumber: randInt(1, Math.min(3, vaccine.total)),
        totalDoses: vaccine.total,
        recommendedAgeLabel: `${vaccine.ageMonths} months`,
        recommendedAgeMonths: vaccine.ageMonths,
        dueDate: dateStr(dueDate),
        administeredDate,
        status,
        manufacturer: administeredDate ? pick(MANUFACTURERS) : null,
        brandName: administeredDate ? faker.commerce.productName() : null,
        batchNumber: administeredDate ? `LOT-${faker.string.alphanumeric(8).toUpperCase()}` : null,
        expiryDate: administeredDate ? dateStr(daysFromNow(randInt(180, 730))) : null,
        administrationSite: administeredDate ? pick(ADMIN_SITES) : null,
        administrationRoute: administeredDate ? pick(ADMIN_ROUTES) : null,
        administeredBy: administeredDate ? adminUserId : null,
        adverseReactions: administeredDate
          ? faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.1 })
          : null,
        parentConsent: administeredDate ? true : false,
        notes: null
      });
    }
  }

  // Bulk insert in chunks to avoid parameter limits
  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    await seedDb.insert(immunizations).values(rows.slice(i, i + chunkSize));
  }

  return rows.length;
}

function monthsBetween(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}
