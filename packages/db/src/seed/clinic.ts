// src/db/seeds/seed-audit.ts
import { faker } from "@faker-js/faker";

import { auditLogs, clinicSettings, departments } from "#@/schema/clinic";
import { ids, pick, seedDb, seedLogger } from "#@/seed/helper";

const ACTIONS = ["CREATE", "UPDATE", "DELETE", "VIEW", "EXPORT", "LOGIN", "RESTORE"] as const;
const ENTITIES = [
  "PATIENT",
  "ENCOUNTER",
  "IMMUNIZATION",
  "PRESCRIPTION",
  "LAB",
  "INVOICE",
  "PAYMENT",
  "ADMISSION",
  "USER",
  "DATABASE"
] as const;
// src/db/seed/seed-clinics.ts

import { clinics } from "#@/schema/clinic";

export async function seedClinics() {
  const logger = seedLogger("seed_clinics");

  const rows = await seedDb
    .insert(clinics)
    .values([
      {
        name: "Sunrise Pediatric Hospital — Main",
        address: faker.location.streetAddress(),
        phone: faker.phone.number({ style: "national" }),
        email: "main@sunrise-pediatrics.test",
        website: "https://sunrise-pediatrics.test",
        timezone: "America/New_York",
        currency: "USD",
        active: true,
        settings: { bedCapacity: 120 }
      },
      {
        name: "Sunrise Pediatric — North Branch",
        address: faker.location.streetAddress(),
        phone: faker.phone.number({ style: "national" }),
        email: "north@sunrise-pediatrics.test",
        website: "https://sunrise-pediatrics.test/north",
        timezone: "America/New_York",
        currency: "USD",
        active: true,
        settings: { bedCapacity: 60 }
      }
    ])
    .returning();

  logger.set({ event: "seed_clinics_ok", counts: { clinics: rows.length } });
  logger.emit();

  return { clinics: rows };
}

const DEPARTMENTS = [
  { name: "General Pediatrics", description: "Routine child healthcare" },
  { name: "Neonatology (NICU)", description: "Newborn intensive care" },
  { name: "Pediatric Intensive Care (PICU)", description: "Critical pediatric care" },
  { name: "Pediatric Cardiology", description: "Heart conditions in children" },
  { name: "Pediatric Neurology", description: "Brain and nervous system" },
  { name: "Pediatric Orthopedics", description: "Bones and musculoskeletal" },
  { name: "Pediatric Pulmonology", description: "Respiratory and lungs" },
  { name: "Pediatric Gastroenterology", description: "Digestive system" },
  { name: "Pediatric Endocrinology", description: "Hormones and growth" },
  { name: "Pediatric Emergency", description: "Emergency pediatric care" },
  { name: "Pediatric Surgery", description: "Surgical services for children" },
  { name: "Pediatric Dermatology", description: "Skin conditions" }
];

export async function seedDepartments() {
  const logger = seedLogger("seed_departments");

  const rows = await seedDb
    .insert(departments)
    .values(
      DEPARTMENTS.map((d, i) => {
        return {
          code: ids.departmentCode(i + 1),
          name: d.name,
          description: d.description,
          isActive: true
        };
      })
    )
    .returning();

  logger.set({ event: "seed_departments_ok", counts: { departments: rows.length } });
  logger.emit();

  return { departments: rows };
}

export async function seedAuditLogs(args: { userIds: string[] }) {
  const { userIds } = args;
  const logger = seedLogger("seed_audit_logs");

  if (userIds.length === 0) {
    logger.set({ event: "seed_audit_logs_skipped", reason: "no_users" });
    logger.emit();
    return 0;
  }

  const rows: (typeof auditLogs.$inferInsert)[] = [];

  for (let i = 0; i < 200; i++) {
    const actorUserId = pick(userIds);
    const action = pick(ACTIONS);
    const entityType = pick(ENTITIES);

    rows.push({
      actorUserId,
      action,
      entityType,
      entityId: faker.string.uuid(),
      metadata: {
        ip: faker.internet.ipv4(),
        userAgent: faker.internet.userAgent(),
        result: "success"
      },
      ipAddress: faker.internet.ipv4(),
      userAgent: faker.internet.userAgent().slice(0, 999),
      createdAt: faker.date.recent({ days: 90 }),
      updatedAt: new Date()
    });
  }

  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    await seedDb.insert(auditLogs).values(rows.slice(i, i + chunkSize));
  }

  logger.set({
    event: "seed_audit_logs_ok",
    counts: { auditLogs: rows.length }
  });
  logger.emit();

  return rows.length;
}
export async function seedClinicSettings() {
  const logger = seedLogger("seed_clinic_settings");

  const [row] = await seedDb
    .insert(clinicSettings)
    .values({
      hospitalName: "Sunrise Pediatric Hospital",
      registrationNumber: "REG-HOSP-2024-001",
      phone: "+1-555-0100",
      email: "info@sunrise-pediatrics.test",
      addressLine1: "100 Health Way",
      addressLine2: "Suite 200",
      city: "Boston",
      state: "MA",
      postalCode: "02101",
      country: "USA",
      timezone: "America/New_York",
      currencyCode: "USD",
      invoicePrefix: "INV-",
      patientPrefix: "MRN-",
      appointmentPrefix: "APT-",
      admissionPrefix: "ADM-",
      labOrderPrefix: "LAB-"
    })
    .returning();

  logger.set({
    event: "seed_clinic_settings_ok",
    clinicSettingsId: row?.id
  });
  logger.emit();

  return row;
}
