import { and, db, eq, isNull } from "#@/index";
import { admissions, bedAllocations, beds, clinicalNotes, rooms, wards } from "#@/schema/index";

export async function findWards() {
  return await db.query.wards.findMany({
    with: {
      rooms: {
        with: {
          beds: true
        }
      }
    }
  });
}

export async function findAvailableBeds() {
  return await db.query.beds.findMany({
    where: { status: "available" },
    columns: {
      id: true,
      bedNumber: true,
      status: true,
      roomId: true
    },
    with: {
      room: {
        columns: {
          id: true,
          roomNumber: true,
          dailyRate: true,
          wardId: true
        },
        with: {
          ward: {
            columns: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  });
}

export async function findAdmissions() {
  return await db.query.admissions.findMany({
    columns: {
      id: true,
      admissionNumber: true,
      status: true,
      admissionReason: true,
      admittedAt: true,
      dischargedAt: true,
      patientId: true,
      attendingDoctorId: true
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
      attendingDoctor: {
        columns: {
          id: true,
          doctorCode: true,
          specialization: true
        },
        with: {
          staff: {
            columns: {
              name: true
            }
          }
        }
      }
    },
    orderBy: { admittedAt: "desc" }
  });
}

export async function findAdmissionById(id: string) {
  return await db.query.admissions.findFirst({
    where: { id },
    columns: {
      id: true,
      admissionNumber: true,
      status: true,
      admissionReason: true,
      admittedAt: true,
      dischargedAt: true,
      dischargeSummary: true,
      patientId: true,
      attendingDoctorId: true
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
      attendingDoctor: {
        columns: {
          id: true,
          doctorCode: true,
          specialization: true
        },
        with: {
          staff: {
            columns: {
              name: true
            }
          }
        }
      },
      bedAllocations: {
        columns: {
          id: true,
          startedAt: true,
          endedAt: true,
          transferReason: true
        },
        with: {
          bed: {
            columns: {
              id: true,
              bedNumber: true
            },
            with: {
              room: {
                columns: {
                  id: true,
                  roomNumber: true
                },
                with: {
                  ward: {
                    columns: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { startedAt: "desc" }
      },
      clinicalNotes: {
        with: {
          author: {
            columns: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });
}

export async function findActiveBedAllocation(admissionId: string) {
  return await db.query.bedAllocations.findFirst({
    where: {
      admissionId,
      endedAt: { isNull: true }
    }
  });
}
// Add after findActiveBedAllocation (line ~177)

export async function findAdmissionsByPatient(patientId: string) {
  return await db.query.admissions.findMany({
    where: { patientId },
    columns: {
      id: true,
      admissionNumber: true,
      status: true,
      admissionReason: true,
      admittedAt: true,
      dischargedAt: true
    },
    with: {
      attendingDoctor: {
        columns: { id: true, doctorCode: true, specialization: true },
        with: { staff: { columns: { name: true } } }
      }
    },
    orderBy: { admittedAt: "desc" }
  });
}

export async function findActiveAdmissions() {
  return await db.query.admissions.findMany({
    where: { status: "admitted" },
    columns: {
      id: true,
      admissionNumber: true,
      admissionReason: true,
      admittedAt: true,
      expectedDischargeAt: true,
      patientId: true,
      attendingDoctorId: true
    },
    with: {
      patient: {
        columns: { id: true, firstName: true, lastName: true, mrn: true }
      },
      attendingDoctor: {
        columns: { id: true, doctorCode: true },
        with: { staff: { columns: { name: true } } }
      },
      currentBedAllocation: {
        with: {
          bed: {
            columns: { id: true, bedNumber: true },
            with: {
              room: {
                columns: { id: true, roomNumber: true },
                with: { ward: { columns: { id: true, name: true } } }
              }
            }
          }
        }
      }
    },
    orderBy: { admittedAt: "desc" }
  });
}

export async function findWardById(id: string) {
  return await db.query.wards.findFirst({
    where: { id },
    with: {
      rooms: {
        with: { beds: true }
      }
    }
  });
}

export async function findBedsByRoom(roomId: string) {
  return await db.query.beds.findMany({
    where: { roomId },
    with: {
      currentAllocation: {
        with: {
          admission: {
            columns: { id: true, admissionNumber: true, patientId: true },
            with: {
              patient: {
                columns: { id: true, firstName: true, lastName: true, mrn: true }
              }
            }
          }
        }
      }
    },
    orderBy: { bedNumber: "asc" }
  });
}

export async function findClinicalNotesByAdmission(admissionId: string) {
  return await db.query.clinicalNotes.findMany({
    where: { admissionId },
    with: {
      author: { columns: { id: true, name: true } }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function insertClinicalNote(data: typeof clinicalNotes.$inferInsert) {
  const [note] = await db.insert(clinicalNotes).values(data).returning();
  return note ?? null;
}

export async function insertBedAllocation(data: typeof bedAllocations.$inferInsert) {
  const [alloc] = await db.insert(bedAllocations).values(data).returning();
  return alloc ?? null;
}

export async function endBedAllocation(
  admissionId: string,
  endedBy: string,
  transferReason?: string
) {
  const [updated] = await db
    .update(bedAllocations)
    .set({ endedAt: new Date(), endedBy, transferReason: transferReason ?? null })
    .where(and(eq(bedAllocations.admissionId, admissionId), isNull(bedAllocations.endedAt)))
    .returning();
  return updated ?? null;
}
export async function findWardByCode(code: string) {
  return await db.query.wards.findFirst({
    where: { code },
    with: { rooms: { with: { beds: true } } }
  });
}

export async function findRoomsByWard(wardId: string) {
  return await db.query.rooms.findMany({
    where: { wardId, isActive: true },
    with: { beds: { where: { isActive: true }, orderBy: { bedNumber: "asc" } } },
    orderBy: { roomNumber: "asc" }
  });
}

export async function findBedById(id: string) {
  return await db.query.beds.findFirst({
    where: { id },
    with: {
      room: { with: { ward: true } },
      currentAllocation: {
        with: {
          admission: {
            with: {
              patient: { columns: { id: true, firstName: true, lastName: true, mrn: true } }
            }
          }
        }
      }
    }
  });
}

export async function findAdmissionByNumber(admissionNumber: string) {
  return await db.query.admissions.findFirst({
    where: { admissionNumber },
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true, mrn: true } },
      attendingDoctor: {
        columns: { id: true, doctorCode: true, specialization: true },
        with: { staff: { columns: { name: true } } }
      }
    }
  });
}

export async function insertAdmission(data: typeof admissions.$inferInsert) {
  const [row] = await db.insert(admissions).values(data).returning();
  return row ?? null;
}

export async function dischargeAdmission(id: string, dischargeSummary: string) {
  const [updated] = await db
    .update(admissions)
    .set({
      status: "discharged",
      dischargedAt: new Date(),
      dischargeSummary,
      updatedAt: new Date()
    })
    .where(eq(admissions.id, id))
    .returning();
  return updated ?? null;
}

export async function updateBedStatus(id: string, status: (typeof beds.$inferSelect)["status"]) {
  const [updated] = await db.update(beds).set({ status }).where(eq(beds.id, id)).returning();
  return updated ?? null;
}

export async function insertWard(data: typeof wards.$inferInsert) {
  const [row] = await db.insert(wards).values(data).returning();
  return row ?? null;
}

export async function insertRoom(data: typeof rooms.$inferInsert) {
  const [row] = await db.insert(rooms).values(data).returning();
  return row ?? null;
}

export async function insertBed(data: typeof beds.$inferInsert) {
  const [row] = await db.insert(beds).values(data).returning();
  return row ?? null;
}
// queries/inpatient.ts — APPEND AT END

export async function findRoomById(id: string) {
  return await db.query.rooms.findFirst({
    where: { id },
    with: {
      ward: { columns: { id: true, name: true, code: true } },
      beds: { orderBy: { bedNumber: "asc" } }
    }
  });
}

export async function updateRoom(id: string, data: Partial<typeof rooms.$inferInsert>) {
  const [updated] = await db
    .update(rooms)
    .set({ ...data })
    .where(eq(rooms.id, id))
    .returning();
  return updated ?? null;
}

export async function updateWard(id: string, data: Partial<typeof wards.$inferInsert>) {
  const [updated] = await db
    .update(wards)
    .set({ ...data })
    .where(eq(wards.id, id))
    .returning();
  return updated ?? null;
}

export async function findBedAllocationById(id: string) {
  return await db.query.bedAllocations.findFirst({
    where: { id },
    with: {
      admission: { columns: { id: true, admissionNumber: true, patientId: true } },
      bed: { with: { room: { with: { ward: true } } } },
      allocatedByUser: { columns: { id: true, name: true } },
      endedByUser: { columns: { id: true, name: true } }
    }
  });
}

export async function findBedAllocationsByAdmission(admissionId: string) {
  return await db.query.bedAllocations.findMany({
    where: { admissionId },
    with: { bed: { with: { room: { with: { ward: true } } } } },
    orderBy: { startedAt: "desc" }
  });
}

export async function findClinicalNoteById(id: string) {
  return await db.query.clinicalNotes.findFirst({
    where: { id },
    with: {
      admission: { columns: { id: true, admissionNumber: true } },
      author: { columns: { id: true, name: true } }
    }
  });
}

export async function updateClinicalNote(
  id: string,
  data: Partial<typeof clinicalNotes.$inferInsert>
) {
  const [updated] = await db
    .update(clinicalNotes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(clinicalNotes.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteClinicalNote(id: string) {
  const [deleted] = await db.delete(clinicalNotes).where(eq(clinicalNotes.id, id)).returning();
  return deleted ?? null;
}

export async function updateAdmission(id: string, data: Partial<typeof admissions.$inferInsert>) {
  const [updated] = await db
    .update(admissions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(admissions.id, id))
    .returning();
  return updated ?? null;
}

export async function countBedsByStatus() {
  const rows = await db.query.beds.findMany({
    where: { isActive: true },
    columns: { status: true }
  });
  const grouped: Record<string, number> = {};
  for (const r of rows) grouped[r.status] = (grouped[r.status] ?? 0) + 1;
  return grouped;
}

export async function findWardsByType(type: string) {
  return await db.query.wards.findMany({
    where: { type, isActive: true },
    with: { rooms: { with: { beds: true } } },
    orderBy: { name: "asc" }
  });
}
