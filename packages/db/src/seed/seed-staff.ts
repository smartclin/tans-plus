// src/db/seed/seed-staff.ts
import { faker } from "@faker-js/faker";

import { type user } from "#@/schema/auth";
import { type clinics, type departments } from "#@/schema/clinic";
import { doctors, doctorSchedules, staff } from "#@/schema/clinical";
import { ids, pick, randFloat, randInt, seedDb } from "#@/seed/helper";

// ─── Shared constants ─────────────────────────────────────────
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
const QUALIFICATIONS = ["MD", "MD, FAAP", "MBBS, DCH", "MD, PhD", "DO", "MBBS, MD"] as const;

const SUPPORT_STAFF_ROLES = [
  { title: "Sr.", role: "staff" as const, specialty: "Nursing", department: "General" },
  { title: "Sr.", role: "staff" as const, specialty: "Reception", department: "General" },
  { title: "Sr.", role: "staff" as const, specialty: "Pharmacy", department: "General" },
  { title: "Sr.", role: "staff" as const, specialty: "Laboratory", department: "General" },
  { title: "Sr.", role: "staff" as const, specialty: "Billing", department: "General" }
] as const;

type UserRow = typeof user.$inferSelect;
type ClinicRow = typeof clinics.$inferSelect;
type DepartmentRow = typeof departments.$inferSelect;

// ─── Doctors + support staff (used by index.ts Phase 2) ───────
export async function seedStaffAndDoctors(args: {
  users: UserRow[];
  clinics: ClinicRow[];
  departments: DepartmentRow[];
}) {
  const { users, clinics, departments } = args;

  if (users.length < 20) {
    throw new Error(`seedStaffAndDoctors requires at least 20 users, got ${users.length}`);
  }
  if (clinics.length === 0) {
    throw new Error("seedStaffAndDoctors requires at least one clinic");
  }
  if (departments.length === 0) {
    throw new Error("seedStaffAndDoctors requires at least one department");
  }

  const mainClinic = clinics[0];

  // 15 doctors
  const doctorStaffPayload: (typeof staff.$inferInsert)[] = users.slice(0, 15).map((u) => {
    return {
      name: `${pick(TITLES)} ${faker.person.firstName()} ${faker.person.lastName()}`,
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

  // 5 support staff
  const supportStaffPayload: (typeof staff.$inferInsert)[] = users.slice(15, 20).map((u, idx) => {
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

  // 1:1 doctor profiles
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

  // Doctor schedules: Mon–Fri, morning + optional afternoon + optional evening
  const scheduleRows: (typeof doctorSchedules.$inferInsert)[] = [];

  for (const doctor of doctorRows) {
    const workingDays = faker.helpers.arrayElements([1, 2, 3, 4, 5], randInt(4, 5));

    for (const day of workingDays) {
      scheduleRows.push({
        doctorId: doctor.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "12:00",
        slotDurationMinutes: pick([15, 20, 30]),
        isActive: true
      });

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

// ─── Standalone support staff (optional) ──────────────────────
const SUPPORT_DEFS = [
  { title: "Sr.", specialty: "Nursing", department: "General" },
  { title: "Sr.", specialty: "Nursing", department: "General" },
  { title: "Sr.", specialty: "Reception", department: "General" },
  { title: "Sr.", specialty: "Pharmacy", department: "General" },
  { title: "Sr.", specialty: "Laboratory", department: "General" },
  { title: "Sr.", specialty: "Billing", department: "General" },
  { title: "Sr.", specialty: "Administration", department: "General" }
];

export async function seedSupportStaff(args: { users: UserRow[]; clinics: ClinicRow[] }) {
  const { users, clinics } = args;
  if (clinics.length === 0) throw new Error("seedSupportStaff requires a clinic");

  const mainClinic = clinics[0];

  const rows: (typeof staff.$inferInsert)[] = users.map((u, idx) => {
    const def = SUPPORT_DEFS[idx % SUPPORT_DEFS.length];
    return {
      name: faker.person.fullName(),
      title: def.title,
      role: "staff" as const,
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

  const inserted = await seedDb.insert(staff).values(rows).returning();
  return { staffRows: inserted };
}
