// src/db/seeds/seed-patient-clinical.ts
import { faker } from "@faker-js/faker";

import { user } from "#@/schema/auth";
import { type clinics } from "#@/schema/clinic";
import {
  guardians,
  patientAllergies,
  patientChronicConditions,
  patientDocuments,
  patients
} from "#@/schema/patients";
import { ids, pick, randFloat, randInt, seedDb, seedLogger } from "#@/seed/helper";

// ─── Constants ────────────────────────────────────────────────
const GENDERS = ["male", "female", "other"] as const;
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"] as const;
const LANGUAGES = ["English", "Arabic", "French", "Spanish", "Other"] as const;
const DELIVERY_METHODS = ["Vaginal", "Cesarean", "Assisted"] as const;
const RELATIONSHIPS = [
  "Mother",
  "Father",
  "Grandparent",
  "Legal Guardian",
  "Foster Parent",
  "Other"
] as const;

const ALLERGY_CATEGORIES = ["Medication", "Food", "Environmental", "Other"] as const;
const ALLERGY_SEVERITIES = ["Mild", "Moderate", "Severe", "Anaphylactic"] as const;
const ALLERGY_STATUSES = ["Active", "Resolved", "Inactive"] as const;
const CONDITION_SEVERITIES = ["Mild", "Moderate", "Severe"] as const;

const COMMON_ALLERGENS = [
  "Peanuts",
  "Penicillin",
  "Eggs",
  "Milk",
  "Shellfish",
  "Soy",
  "Wheat",
  "Latex",
  "Pollen",
  "Dust mites",
  "Amoxicillin",
  "Sulfa drugs",
  "Ibuprofen"
];

const COMMON_CONDITIONS = [
  { name: "Asthma", icd: "J45" },
  { name: "Type 1 Diabetes", icd: "E10" },
  { name: "Epilepsy", icd: "G40" },
  { name: "Celiac Disease", icd: "K90" },
  { name: "ADHD", icd: "F90" },
  { name: "Autism Spectrum Disorder", icd: "F84" },
  { name: "Congenital Heart Defect", icd: "Q24" },
  { name: "Sickle Cell Anemia", icd: "D57" },
  { name: "Eczema", icd: "L20" },
  { name: "Chronic Kidney Disease", icd: "N18" }
];

type ClinicRow = typeof clinics.$inferSelect;
type PatientRow = typeof patients.$inferSelect;

// ─── Patients + parents ───────────────────────────────────────
export async function seedPatients(args: { clinics: ClinicRow[]; pediatricianIds: string[] }) {
  const { clinics, pediatricianIds } = args;
  const logger = seedLogger("seed_patients");

  if (clinics.length === 0) throw new Error("seedPatients requires at least one clinic");

  const mainClinic = clinics[0];

  // Parent user accounts
  const parentUsers = await seedDb
    .insert(user)
    .values(
      Array.from({ length: 60 }, () => {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        return {
          id: faker.string.uuid(),
          name: `${firstName} ${lastName}`,
          email: faker.internet.email({ firstName, lastName }).toLowerCase(),
          passwordHash: "$2b$10$placeholderHashForSeeding",
          phone: faker.phone.number({ style: "national" }),
          status: "active" as const,
          emailVerified: true,
          role: "patient" as const
        };
      })
    )
    .returning();

  // Patients
  const patientRows = await seedDb
    .insert(patients)
    .values(
      parentUsers.map((u, i) => {
        const gender = pick(GENDERS);
        const dob = faker.date.birthdate({ min: 0, max: 17, mode: "age" });

        return {
          mrn: ids.mrn(i + 1),
          firstName: faker.person.firstName(gender === "other" ? undefined : gender),
          lastName: faker.person.lastName(),
          dateOfBirth: dob.toISOString().slice(0, 10),
          phone: u.phone ?? faker.phone.number({ style: "national" }),
          alternatePhone: faker.phone.number({ style: "national" }),
          email: faker.internet.email().toLowerCase(),
          addressLine1: faker.location.streetAddress(),
          addressLine2: faker.location.secondaryAddress(),
          city: faker.location.city(),
          state: faker.location.state({ abbreviated: true }),
          postalCode: faker.location.zipCode(),
          country: "USA",
          emergencyContactName: faker.person.fullName(),
          emergencyContactRelationship: pick(RELATIONSHIPS),
          emergencyContactPhone: faker.phone.number({ style: "national" }),
          medicalAlerts:
            faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.2 }) ?? null,
          gender,
          bloodGroup: pick(BLOOD_GROUPS),
          birthWeightKg: randFloat(2.4, 4.2, 2),
          birthLengthCm: randFloat(45, 55, 1),
          birthHeadCircumferenceCm: randFloat(32, 38, 1),
          deliveryMethod: pick(DELIVERY_METHODS),
          preferredLanguage: pick(LANGUAGES),
          activeStatus: "active" as const,
          notes: faker.helpers.maybe(() => faker.lorem.paragraph(), { probability: 0.3 }) ?? null,
          userId: u.id,
          pediatricianId: pediatricianIds.length > 0 ? pick(pediatricianIds) : null,
          clinicId: mainClinic.id
        };
      })
    )
    .returning();

  // Guardians (1–2 per patient)
  const guardianRows: (typeof guardians.$inferInsert)[] = [];
  for (const p of patientRows) {
    const count = randInt(1, 2);
    for (let i = 0; i < count; i++) {
      guardianRows.push({
        patientId: p.id,
        name: faker.person.fullName(),
        relationship: i === 0 ? "Mother" : pick(RELATIONSHIPS),
        phone: faker.phone.number({ style: "national" }),
        email: faker.internet.email().toLowerCase(),
        address: faker.location.streetAddress(),
        isPrimary: i === 0,
        emergencyContact: true,
        contactOrder: i + 1,
        notes: null
      });
    }
  }

  if (guardianRows.length > 0) {
    await seedDb.insert(guardians).values(guardianRows);
  }

  logger.set({
    event: "seed_patients_ok",
    counts: {
      patients: patientRows.length,
      parentUsers: parentUsers.length,
      guardians: guardianRows.length
    }
  });
  logger.emit();

  return { patients: patientRows, patientUsers: parentUsers };
}

// ─── Patient clinical sub-records ─────────────────────────────
export async function seedPatientClinical(args: { patients: PatientRow[] }) {
  const { patients: patientRows } = args;

  // Allergies
  const allergyRows: (typeof patientAllergies.$inferInsert)[] = [];
  for (const p of patientRows) {
    const count = randInt(0, 3);
    const allergens = faker.helpers.arrayElements(COMMON_ALLERGENS, count);
    for (const allergen of allergens) {
      allergyRows.push({
        patientId: p.id,
        allergen,
        category: pick(ALLERGY_CATEGORIES),
        severity: pick(ALLERGY_SEVERITIES),
        status: pick(ALLERGY_STATUSES),
        reaction: faker.lorem.sentence(),
        identifiedDate: faker.date.past({ years: 5 }).toISOString().slice(0, 10),
        onsetDate: faker.date.past({ years: 5 }).toISOString().slice(0, 10),
        resolutionDate: null,
        notes: null
      });
    }
  }
  if (allergyRows.length > 0) {
    await seedDb.insert(patientAllergies).values(allergyRows);
  }

  // Chronic conditions
  const conditionRows: (typeof patientChronicConditions.$inferInsert)[] = [];
  for (const p of patientRows) {
    const count = randInt(0, 2);
    const conditions = faker.helpers.arrayElements(COMMON_CONDITIONS, count);
    for (const c of conditions) {
      conditionRows.push({
        patientId: p.id,
        condition: c.name,
        icdCode: c.icd,
        diagnosedDate: faker.date.past({ years: 5 }).toISOString().slice(0, 10),
        status: pick(["Active", "Resolved", "In Remission"] as const),
        severity: pick(CONDITION_SEVERITIES),
        notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.4 }) ?? null
      });
    }
  }
  if (conditionRows.length > 0) {
    await seedDb.insert(patientChronicConditions).values(conditionRows);
  }

  // Documents
  const docRows: (typeof patientDocuments.$inferInsert)[] = [];
  for (const p of patientRows) {
    const count = randInt(0, 2);
    for (let i = 0; i < count; i++) {
      docRows.push({
        patientId: p.id,
        documentType: pick(["id_proof", "lab_report", "prescription", "other"] as const),
        title: faker.lorem.words(3),
        storageKey: `patient-docs/${p.id}/${faker.string.uuid()}.pdf`,
        mimeType: "application/pdf",
        sizeBytes: randInt(50_000, 5_000_000),
        uploadedBy: p.userId
      });
    }
  }
  if (docRows.length > 0) {
    await seedDb.insert(patientDocuments).values(docRows);
  }

  return {
    allergies: allergyRows.length,
    conditions: conditionRows.length,
    documents: docRows.length
  };
}
