import { faker } from "@faker-js/faker";

// src/db/seeds/seed-lab-tests.ts
import { type doctors, type encounters } from "#@/schema/clinical";
import { type patients } from "#@/schema/index";
import { labOrderItems, labOrders, labTests } from "#@/schema/laboratory";
import { ids, pick, pickN, randInt, seedDb } from "#@/seed/helper";

const LAB_TESTS = [
  {
    name: "Complete Blood Count (CBC)",
    sampleType: "Blood",
    referenceRange: "See differential",
    unit: "cells/μL",
    price: 45
  },
  {
    name: "Basic Metabolic Panel (BMP)",
    sampleType: "Blood",
    referenceRange: "See panel",
    unit: "mmol/L",
    price: 65
  },
  {
    name: "Comprehensive Metabolic Panel",
    sampleType: "Blood",
    referenceRange: "See panel",
    unit: "mmol/L",
    price: 85
  },
  {
    name: "Lipid Panel",
    sampleType: "Blood",
    referenceRange: "See panel",
    unit: "mg/dL",
    price: 55
  },
  {
    name: "Liver Function Tests (LFT)",
    sampleType: "Blood",
    referenceRange: "See panel",
    unit: "IU/L",
    price: 70
  },
  {
    name: "C-Reactive Protein (CRP)",
    sampleType: "Blood",
    referenceRange: "< 5",
    unit: "mg/L",
    price: 40
  },
  {
    name: "Erythrocyte Sedimentation Rate (ESR)",
    sampleType: "Blood",
    referenceRange: "0-20",
    unit: "mm/hr",
    price: 35
  },
  { name: "Urinalysis", sampleType: "Urine", referenceRange: "Normal", unit: null, price: 30 },
  {
    name: "Urine Culture",
    sampleType: "Urine",
    referenceRange: "No growth",
    unit: null,
    price: 55
  },
  {
    name: "Blood Culture",
    sampleType: "Blood",
    referenceRange: "No growth",
    unit: null,
    price: 75
  },
  {
    name: "Thyroid Stimulating Hormone (TSH)",
    sampleType: "Blood",
    referenceRange: "0.5-4.5",
    unit: "mIU/L",
    price: 50
  },
  { name: "Hemoglobin A1c", sampleType: "Blood", referenceRange: "< 5.7", unit: "%", price: 45 },
  {
    name: "Vitamin D, 25-Hydroxy",
    sampleType: "Blood",
    referenceRange: "30-100",
    unit: "ng/mL",
    price: 60
  },
  { name: "Ferritin", sampleType: "Blood", referenceRange: "10-120", unit: "ng/mL", price: 50 },
  {
    name: "Rapid Strep Test",
    sampleType: "Throat swab",
    referenceRange: "Negative",
    unit: null,
    price: 25
  },
  {
    name: "Influenza A/B PCR",
    sampleType: "Nasal swab",
    referenceRange: "Negative",
    unit: null,
    price: 80
  },
  {
    name: "RSV Antigen",
    sampleType: "Nasal swab",
    referenceRange: "Negative",
    unit: null,
    price: 55
  },
  {
    name: "COVID-19 PCR",
    sampleType: "Nasal swab",
    referenceRange: "Negative",
    unit: null,
    price: 90
  },
  {
    name: "Stool Culture",
    sampleType: "Stool",
    referenceRange: "No pathogens",
    unit: null,
    price: 65
  },
  {
    name: "Celiac Panel (tTG-IgA)",
    sampleType: "Blood",
    referenceRange: "< 4",
    unit: "U/mL",
    price: 95
  }
];

export async function seedLabTests() {
  const rows = await seedDb
    .insert(labTests)
    .values(
      LAB_TESTS.map((t, i) => {
        return {
          code: ids.labTestCode(i + 1),
          name: t.name,
          description: `Standard ${t.name} panel`,
          sampleType: t.sampleType,
          price: t.price.toFixed(2),
          referenceRange: t.referenceRange,
          unit: t.unit,
          isActive: true
        };
      })
    )
    .returning();

  return { labTests: rows };
}

type PatientRow = typeof patients.$inferSelect;
type DoctorRow = typeof doctors.$inferSelect;
type EncounterRow = typeof encounters.$inferSelect;
type LabTestRow = typeof labTests.$inferSelect;

const LAB_STATUSES = ["ordered", "collected", "processing", "completed", "cancelled"] as const;

export async function seedLabOrders(args: {
  patients: PatientRow[];
  doctors: DoctorRow[];
  labTests: LabTestRow[];
  encounters: EncounterRow[];
}) {
  const { patients, doctors, labTests, encounters: encounterRows } = args;

  const orderRows: (typeof labOrders.$inferInsert)[] = [];
  const itemRows: (typeof labOrderItems.$inferInsert)[] = [];

  const orderCount = 80;

  for (let i = 1; i <= orderCount; i++) {
    const patient = pick(patients);
    const doctor = pick(doctors);
    const linkedEncounter = Math.random() < 0.7 ? pick(encounterRows) : null;

    const orderedAt = faker.date.between({ from: "-90d" as unknown as Date, to: new Date() });
    const status = pick(LAB_STATUSES);
    const collectedAt = ["collected", "processing", "completed"].includes(status)
      ? new Date(orderedAt.getTime() + randInt(30, 240) * 60_000)
      : null;
    const completedAt =
      status === "completed" && collectedAt
        ? new Date(collectedAt.getTime() + randInt(60, 1440) * 60_000)
        : null;

    const [order] = await seedDb
      .insert(labOrders)
      .values({
        labOrderNumber: ids.labOrderNumber(i),
        patientId: patient.id,
        encounterId: linkedEncounter?.id ?? null,
        admissionId: null,
        orderedByDoctorId: doctor.id,
        status,
        orderedAt,
        collectedAt,
        completedAt
      })
      .returning();

    orderRows.push(order);

    // 1-4 tests per order
    const testCount = randInt(1, 4);
    const selectedTests = pickN(labTests, testCount);

    for (const test of selectedTests) {
      const itemStatus = status === "completed" ? "completed" : status;

      itemRows.push({
        labOrderId: order.id,
        labTestId: test.id,
        testNameSnapshot: test.name,
        priceSnapshot: test.price,
        status: itemStatus,
        resultValue: itemStatus === "completed" ? generateResult(test) : null,
        resultText: itemStatus === "completed" ? faker.lorem.sentence() : null,
        referenceRangeSnapshot: test.referenceRange,
        unitSnapshot: test.unit,
        resultedByUserId: itemStatus === "completed" ? doctor.staffId : null,
        resultedAt: itemStatus === "completed" && completedAt ? completedAt : null
      });
    }
  }

  await seedDb.insert(labOrderItems).values(itemRows);

  return { labOrderCount: orderRows.length, labItemCount: itemRows.length };
}

function generateResult(test: LabTestRow): string {
  if (
    test.name.includes("Culture") ||
    test.name.includes("PCR") ||
    test.name.includes("Antigen") ||
    test.name.includes("Strep")
  ) {
    return pick(["Negative", "Negative", "Negative", "Positive"]);
  }
  if (test.name.includes("Hemoglobin A1c")) return (Math.random() * 3 + 4.5).toFixed(1);
  if (test.name.includes("TSH")) return (Math.random() * 4 + 0.5).toFixed(2);
  if (test.name.includes("CRP")) return (Math.random() * 20).toFixed(1);
  return (Math.random() * 100).toFixed(1);
}
