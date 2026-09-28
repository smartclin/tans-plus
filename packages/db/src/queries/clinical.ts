// queries/clinical.ts
import { and, asc, eq, ilike, or } from "drizzle-orm";

import { db } from "#@/index";
import { departments } from "#@/schema/clinic";
import { doctors, doctorSchedules, staff } from "#@/schema/clinical";
import { type CreateDoctorInput, type CreateDoctorScheduleInput } from "#@/validations/clinical";

// ─────────────────────────────────────────────────────────────
// Shape normalization
//
// The search path (db.select + join) and the RQB path (db.query)
// return structurally DIFFERENT objects. We normalize both to the
// same flat DTO so API consumers don't break when a search filter
// is toggled.
// ─────────────────────────────────────────────────────────────
export type DoctorListItem = {
  id: string;
  doctorCode: string;
  registrationNumber: string;
  specialization: string;
  qualification: string | null;
  consultationFee: string;
  isActive: boolean;
  departmentId: string;
  departmentName: string | null;
  createdAt: Date;
  staffId: string;
  staffName: string;
  staffEmail: string;
  staffPhone: string | null;
};

// ─────────────────────────────────────────────────────────────
// findDoctors
// ─────────────────────────────────────────────────────────────
export async function findDoctors(
  search?: string,
  departmentId?: string
): Promise<DoctorListItem[]> {
  const trimmed = search?.trim();
  const hasSearch = !!trimmed && trimmed.length > 0;

  // ── Search path: needs ILIKE + OR → db.select() with explicit join
  if (hasSearch) {
    const term = `%${trimmed}%`;
    const conditions = [
      or(
        ilike(staff.name, term),
        ilike(doctors.specialization, term),
        ilike(doctors.doctorCode, term)
      )
    ];

    if (departmentId) {
      conditions.push(eq(doctors.departmentId, departmentId));
    }

    const rows = await db
      .select({
        id: doctors.id,
        doctorCode: doctors.doctorCode,
        registrationNumber: doctors.registrationNumber,
        specialization: doctors.specialization,
        qualification: doctors.qualification,
        consultationFee: doctors.consultationFee,
        isActive: doctors.isActive,
        departmentId: doctors.departmentId,
        departmentName: departments.name,
        createdAt: doctors.createdAt,
        staffId: staff.id,
        staffName: staff.name,
        staffEmail: staff.email,
        staffPhone: staff.phone
      })
      .from(doctors)
      .innerJoin(staff, eq(doctors.staffId, staff.id))
      .leftJoin(departments, eq(doctors.departmentId, departments.id))
      .where(and(...conditions))
      .orderBy(asc(staff.name));

    return rows;
  }

  // ── No-search path: RQB for clean nested access
  const rows = await db.query.doctors.findMany({
    where: departmentId ? { departmentId } : undefined,
    columns: {
      id: true,
      doctorCode: true,
      registrationNumber: true,
      specialization: true,
      qualification: true,
      consultationFee: true,
      isActive: true,
      departmentId: true,
      createdAt: true
    },
    with: {
      staff: {
        columns: { id: true, name: true, email: true, phone: true }
      },
      department: {
        columns: { id: true, name: true }
      }
    },
    orderBy: { specialization: "asc" }
  });

  // Normalize RQB nested shape → flat DTO
  return rows.map((d) => {
    return {
      id: d.id,
      doctorCode: d.doctorCode,
      registrationNumber: d.registrationNumber,
      specialization: d.specialization,
      qualification: d.qualification,
      consultationFee: d.consultationFee,
      isActive: d.isActive,
      departmentId: d.departmentId,
      departmentName: d.department?.name ?? null,
      createdAt: d.createdAt,
      staffId: d.staff.id,
      staffName: d.staff.name,
      staffEmail: d.staff.email,
      staffPhone: d.staff.phone
    };
  });
}

// ─────────────────────────────────────────────────────────────
// findDoctorById
// ─────────────────────────────────────────────────────────────
export async function findDoctorById(id: string) {
  return await db.query.doctors.findFirst({
    where: { id },
    columns: {
      id: true,
      doctorCode: true,
      registrationNumber: true,
      specialization: true,
      qualification: true,
      consultationFee: true,
      isActive: true,
      departmentId: true,
      createdAt: true
    },
    with: {
      staff: {
        columns: { id: true, name: true, email: true, phone: true }
      },
      department: {
        columns: { id: true, name: true }
      },
      schedules: {
        orderBy: { dayOfWeek: "asc" }
      }
    }
  });
}

// ─────────────────────────────────────────────────────────────
// insertDoctor
//
// Creates a `staff` row + a `doctors` profile row atomically.
//
// The transaction guarantees:
//   - both rows commit together, or
//   - both roll back (no orphaned staff rows).
//
// Every NOT NULL column on `staff` is provided explicitly:
//   name, title, role, licenseNumber, avatarColor, pinHash, userId, email
// Every NOT NULL column on `doctors` is provided explicitly:
//   staffId, departmentId, doctorCode, registrationNumber,
//   specialization, consultationFee
// ─────────────────────────────────────────────────────────────
export async function insertDoctor(data: CreateDoctorInput) {
  return await db.transaction(async (tx) => {
    // 1) staff row
    const [newStaff] = await tx
      .insert(staff)
      .values({
        name: data.name,
        title: data.title,
        role: "doctor",
        licenseNumber: data.registrationNumber,
        avatarColor: data.avatarColor,
        pinHash: data.pinHash,
        userId: data.userId,
        email: data.email,
        phone: data.phone ?? null,
        clinicId: data.clinicId ?? null,
        bio: data.bio ?? null,
        specialty: data.specialty ?? "General Pediatrics",
        department: data.department ?? "General",
        isActive: true
      })
      .returning({ id: staff.id });

    if (!newStaff) {
      // Drizzle's .returning() only yields undefined on failure;
      // throwing inside tx forces rollback of any prior writes.
      throw new Error("Failed to create staff record for doctor");
    }

    // 2) doctors profile row
    const [newDoc] = await tx
      .insert(doctors)
      .values({
        staffId: newStaff.id,
        departmentId: data.departmentId,
        doctorCode: data.doctorCode,
        registrationNumber: data.registrationNumber,
        specialization: data.specialization,
        qualification: data.qualification ?? null,
        consultationFee: data.consultationFee.toString(),
        isActive: true
      })
      .returning();

    if (!newDoc) {
      throw new Error("Failed to create doctor profile");
    }

    return newDoc;
  });
}

// ─────────────────────────────────────────────────────────────
// insertDoctorSchedule
//
// FIX: Return type was `newSchedule ?? null` but Drizzle's
// `.returning()` always yields an array; destructuring `[x]`
// gives `T | undefined`. We now throw on failure instead of
// silently returning null, which hides constraint violations.
// ─────────────────────────────────────────────────────────────
export async function insertDoctorSchedule(data: CreateDoctorScheduleInput) {
  const [newSchedule] = await db
    .insert(doctorSchedules)
    .values({
      doctorId: data.doctorId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      slotDurationMinutes: data.slotDurationMinutes,
      isActive: true
    })
    .returning();

  if (!newSchedule) {
    throw new Error("Failed to create doctor schedule");
  }

  return newSchedule;
}
// Add after insertDoctorSchedule (line ~255)

export async function findDoctorSchedules(doctorId: string) {
  return await db.query.doctorSchedules.findMany({
    where: { doctorId, isActive: true },
    orderBy: { dayOfWeek: "asc" }
  });
}

export async function findDoctorsByDepartment(departmentId: string) {
  return await db.query.doctors.findMany({
    where: { departmentId, isActive: true },
    columns: {
      id: true,
      doctorCode: true,
      specialization: true,
      consultationFee: true,
      departmentId: true
    },
    with: {
      staff: { columns: { id: true, name: true, email: true, phone: true } },
      department: { columns: { id: true, name: true } }
    },
    orderBy: { specialization: "asc" }
  });
}

export async function updateDoctor(
  id: string,
  data: Partial<{
    specialization: string;
    qualification: string;
    consultationFee: string;
    isActive: boolean;
  }>
) {
  const [updated] = await db
    .update(doctors)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(doctors.id, id))
    .returning();
  return updated ?? null;
}

export async function deactivateDoctor(id: string) {
  const [updated] = await db
    .update(doctors)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(doctors.id, id))
    .returning();
  return updated ?? null;
}
export async function findDoctorByCode(doctorCode: string) {
  return await db.query.doctors.findFirst({
    where: { doctorCode },
    with: {
      staff: { columns: { id: true, name: true, email: true, phone: true } },
      department: { columns: { id: true, name: true } }
    }
  });
}

export async function findDoctorByStaffId(staffId: string) {
  return await db.query.doctors.findFirst({
    where: { staffId },
    with: {
      department: { columns: { id: true, name: true } },
      schedules: { where: { isActive: true }, orderBy: { dayOfWeek: "asc" } }
    }
  });
}

export async function findDoctorSchedulesByDay(doctorId: string, dayOfWeek: number) {
  return await db.query.doctorSchedules.findMany({
    where: { doctorId, dayOfWeek, isActive: true },
    orderBy: { startTime: "asc" }
  });
}

export async function deactivateDoctorSchedule(id: string) {
  const [updated] = await db
    .update(doctorSchedules)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(doctorSchedules.id, id))
    .returning();
  return updated ?? null;
}

export async function findStaffById(id: string) {
  return await db.query.staff.findFirst({
    where: { id },
    with: {
      user: { columns: { id: true, name: true, email: true } },
      clinic: { columns: { id: true, name: true } },
      doctorProfile: true
    }
  });
}

export async function findActiveStaff() {
  return await db.query.staff.findMany({
    where: { isActive: true },
    columns: {
      id: true,
      name: true,
      title: true,
      role: true,
      email: true,
      phone: true,
      specialty: true,
      department: true
    },
    orderBy: { name: "asc" }
  });
}
// queries/clinical.ts — APPEND AT END

export async function updateDoctorSchedule(
  id: string,
  data: Partial<typeof doctorSchedules.$inferInsert>
) {
  const [updated] = await db
    .update(doctorSchedules)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(doctorSchedules.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteDoctorSchedule(id: string) {
  const [deleted] = await db.delete(doctorSchedules).where(eq(doctorSchedules.id, id)).returning();
  return deleted ?? null;
}

export async function findStaffByUserId(userId: string) {
  return await db.query.staff.findFirst({
    where: { userId },
    with: {
      clinic: { columns: { id: true, name: true } },
      doctorProfile: true
    }
  });
}

export async function findStaffByEmail(email: string) {
  return await db.query.staff.findFirst({
    where: { email },
    with: { doctorProfile: true }
  });
}

export async function findDoctorsByStaffRole() {
  return await db.query.staff.findMany({
    where: { role: "doctor", isActive: true },
    with: { doctorProfile: true },
    orderBy: { name: "asc" }
  });
}

export async function deactivateStaff(id: string) {
  const [updated] = await db
    .update(staff)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(staff.id, id))
    .returning();
  return updated ?? null;
}

export async function updateStaff(id: string, data: Partial<typeof staff.$inferInsert>) {
  const [updated] = await db
    .update(staff)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(staff.id, id))
    .returning();
  return updated ?? null;
}

export async function findDoctorsWithoutSchedules() {
  return await db.query.doctors
    .findMany({
      where: { isActive: true },
      with: { schedules: true, staff: { columns: { name: true } } }
    })
    .then((rows) => rows.filter((d) => d.schedules.length === 0));
}

export async function countDoctorsByDepartment() {
  const rows = await db.query.doctors.findMany({
    where: { isActive: true },
    columns: { departmentId: true }
  });
  const grouped: Record<string, number> = {};
  for (const r of rows) grouped[r.departmentId] = (grouped[r.departmentId] ?? 0) + 1;
  return grouped;
}
