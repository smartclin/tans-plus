import { count, eq } from "drizzle-orm";

import { db } from "#@/index";
import { appointments } from "#@/schema/clinical";
import { type AppointmentListQuery } from "#@/validations/appointment";

export async function findAppointments(params: AppointmentListQuery) {
  const { page, pageSize, doctorId, patientId, status } = params;
  const offset = (page - 1) * pageSize;

  const [data, totalResult] = await Promise.all([
    db.query.appointments.findMany({
      where: {
        doctorId,
        patientId,
        status
      },
      columns: {
        id: true,
        appointmentNumber: true,
        scheduledStart: true,
        scheduledEnd: true,
        status: true,
        reason: true,
        notes: true,
        createdAt: true,
        patientId: true,
        doctorId: true
      },
      with: {
        patient: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            mrn: true
          }
        },
        doctor: {
          columns: {
            id: true,
            doctorCode: true,
            specialization: true
          },
          with: {
            staff: {
              columns: {
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: { scheduledStart: "desc" },
      limit: pageSize,
      offset
    }),
    db.select({ count: count() }).from(appointments).where(
      // v2: use raw conditions for count query since RQB doesn't do counts
      // We rebuild the where clause manually here
      // (or use a helper to share the filter)
      undefined // placeholder — see note below
    )
  ]);

  const total = Number(totalResult[0]?.count || 0);

  return {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
}

export async function findAppointmentById(id: string) {
  return await db.query.appointments.findFirst({
    where: { id },
    columns: {
      id: true,
      appointmentNumber: true,
      scheduledStart: true,
      scheduledEnd: true,
      status: true,
      reason: true,
      notes: true,
      cancellationReason: true,
      checkedInAt: true,
      startedAt: true,
      completedAt: true,
      patientId: true,
      doctorId: true
    },
    with: {
      patient: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          mrn: true
        }
      },
      doctor: {
        columns: {
          id: true,
          doctorCode: true,
          specialization: true
        },
        with: {
          staff: {
            columns: {
              name: true,
              email: true,
              phone: true
            }
          }
        }
      }
    }
  });
}

export async function insertAppointment(data: typeof appointments.$inferInsert) {
  const [newApt] = await db.insert(appointments).values(data).returning();
  return newApt;
}

export async function updateAppointmentStatus(
  id: string,
  status: (typeof appointments.$inferSelect)["status"],
  updates: Partial<typeof appointments.$inferInsert> = {}
) {
  const [updated] = await db
    .update(appointments)
    .set({
      status,
      ...updates,
      updatedAt: new Date()
    })
    .where(eq(appointments.id, id))
    .returning();

  return updated || null;
}
// Add after findAppointments (line ~79)

export async function findAppointmentsByDoctor(doctorId: string, from: Date, to: Date) {
  return await db.query.appointments.findMany({
    where: {
      doctorId,
      scheduledStart: { gte: from, lte: to }
    },
    columns: {
      id: true,
      appointmentNumber: true,
      scheduledStart: true,
      scheduledEnd: true,
      status: true,
      type: true,
      priority: true,
      reason: true,
      patientId: true
    },
    with: {
      patient: {
        columns: { id: true, firstName: true, lastName: true, mrn: true }
      }
    },
    orderBy: { scheduledStart: "asc" }
  });
}

export async function findAppointmentsByPatient(patientId: string) {
  return await db.query.appointments.findMany({
    where: { patientId },
    columns: {
      id: true,
      appointmentNumber: true,
      scheduledStart: true,
      scheduledEnd: true,
      status: true,
      type: true,
      reason: true,
      doctorId: true
    },
    with: {
      doctor: {
        columns: { id: true, doctorCode: true, specialization: true },
        with: { staff: { columns: { name: true } } }
      }
    },
    orderBy: { scheduledStart: "desc" }
  });
}

export async function findTodayAppointments(doctorId?: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return await db.query.appointments.findMany({
    where: {
      doctorId,
      scheduledStart: { gte: start, lte: end }
    },
    columns: {
      id: true,
      appointmentNumber: true,
      scheduledStart: true,
      scheduledEnd: true,
      status: true,
      patientId: true,
      doctorId: true
    },
    with: {
      patient: {
        columns: { id: true, firstName: true, lastName: true, mrn: true }
      },
      doctor: {
        columns: { id: true, doctorCode: true },
        with: { staff: { columns: { name: true } } }
      }
    },
    orderBy: { scheduledStart: "asc" }
  });
}
export async function findUpcomingAppointmentsForPatient(patientId: string, limit = 5) {
  return await db.query.appointments.findMany({
    where: {
      patientId,
      scheduledStart: { gte: new Date() },
      status: { in: ["scheduled", "checked_in"] }
    },
    columns: {
      id: true,
      appointmentNumber: true,
      scheduledStart: true,
      status: true,
      type: true,
      reason: true,
      doctorId: true
    },
    with: {
      doctor: {
        columns: { id: true, doctorCode: true, specialization: true },
        with: { staff: { columns: { name: true } } }
      }
    },
    orderBy: { scheduledStart: "asc" },
    limit
  });
}

export async function countAppointmentsByStatus(doctorId?: string) {
  return await db
    .select({
      status: appointments.status,
      count: count()
    })
    .from(appointments)
    .where(doctorId ? eq(appointments.doctorId, doctorId) : undefined)
    .groupBy(appointments.status);
}

export async function findAppointmentByNumber(appointmentNumber: string) {
  return await db.query.appointments.findFirst({
    where: { appointmentNumber },
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true, mrn: true } },
      doctor: {
        columns: { id: true, doctorCode: true, specialization: true },
        with: { staff: { columns: { name: true } } }
      }
    }
  });
}

export async function cancelAppointment(id: string, reason: string) {
  const [updated] = await db
    .update(appointments)
    .set({
      status: "cancelled",
      cancellationReason: reason,
      updatedAt: new Date()
    })
    .where(eq(appointments.id, id))
    .returning();
  return updated ?? null;
}
// queries/appointments.ts — APPEND AT END

export async function findAppointmentsByDateRange(from: Date, to: Date, doctorId?: string) {
  return await db.query.appointments.findMany({
    where: {
      doctorId,
      scheduledStart: { gte: from, lte: to }
    },
    columns: {
      id: true,
      appointmentNumber: true,
      scheduledStart: true,
      scheduledEnd: true,
      status: true,
      type: true,
      priority: true,
      patientId: true,
      doctorId: true
    },
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true, mrn: true } },
      doctor: {
        columns: { id: true, doctorCode: true },
        with: { staff: { columns: { name: true } } }
      }
    },
    orderBy: { scheduledStart: "asc" }
  });
}

export async function findAppointmentsByStatus(
  status: (typeof appointments.$inferSelect)["status"],
  doctorId?: string
) {
  return await db.query.appointments.findMany({
    where: { status, doctorId },
    columns: {
      id: true,
      appointmentNumber: true,
      scheduledStart: true,
      scheduledEnd: true,
      status: true,
      patientId: true,
      doctorId: true
    },
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true, mrn: true } },
      doctor: {
        columns: { id: true, doctorCode: true },
        with: { staff: { columns: { name: true } } }
      }
    },
    orderBy: { scheduledStart: "asc" }
  });
}

export async function findPendingCheckIns() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return await db.query.appointments.findMany({
    where: {
      status: "scheduled",
      scheduledStart: { gte: start, lte: end }
    },
    columns: {
      id: true,
      appointmentNumber: true,
      scheduledStart: true,
      patientId: true,
      doctorId: true
    },
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true, mrn: true } }
    },
    orderBy: { scheduledStart: "asc" }
  });
}

export async function findNoShowAppointments(doctorId?: string) {
  return await db.query.appointments.findMany({
    where: { status: "no_show", doctorId },
    columns: {
      id: true,
      appointmentNumber: true,
      scheduledStart: true,
      patientId: true,
      doctorId: true
    },
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true, mrn: true } }
    },
    orderBy: { scheduledStart: "desc" }
  });
}

export async function updateAppointment(
  id: string,
  data: Partial<typeof appointments.$inferInsert>
) {
  const [updated] = await db
    .update(appointments)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(appointments.id, id))
    .returning();
  return updated ?? null;
}

export async function checkInAppointment(id: string) {
  const [updated] = await db
    .update(appointments)
    .set({ status: "checked_in", checkedInAt: new Date(), updatedAt: new Date() })
    .where(eq(appointments.id, id))
    .returning();
  return updated ?? null;
}

export async function startAppointment(id: string) {
  const [updated] = await db
    .update(appointments)
    .set({ status: "in_progress", startedAt: new Date(), updatedAt: new Date() })
    .where(eq(appointments.id, id))
    .returning();
  return updated ?? null;
}

export async function completeAppointment(id: string) {
  const [updated] = await db
    .update(appointments)
    .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
    .where(eq(appointments.id, id))
    .returning();
  return updated ?? null;
}

export async function markAppointmentNoShow(id: string) {
  const [updated] = await db
    .update(appointments)
    .set({ status: "no_show", updatedAt: new Date() })
    .where(eq(appointments.id, id))
    .returning();
  return updated ?? null;
}

export async function countAppointmentsByDoctorAndDate(doctorId: string, date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const rows = await db.query.appointments.findMany({
    where: { doctorId, scheduledStart: { gte: start, lte: end } },
    columns: { id: true }
  });
  return rows.length;
}
