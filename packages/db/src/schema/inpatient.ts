import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

import { timestamps } from "#@/schema/_helper";
import { user } from "#@/schema/auth";
import { doctors } from "#@/schema/clinical";
import { admissionStatusEnum, bedStatusEnum, clinicalNoteTypeEnum } from "#@/schema/common";
import { patients } from "#@/schema/patients";

export const wards = pgTable("wards", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  type: varchar("type", { length: 50 }).notNull(),
  isActive: boolean("is_active").default(true).notNull()
});

export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    wardId: uuid("ward_id")
      .references(() => wards.id)
      .notNull(),
    roomNumber: varchar("room_number", { length: 50 }).notNull(),
    roomType: varchar("room_type", { length: 50 }).notNull(),
    dailyRate: numeric("daily_rate", { precision: 10, scale: 2 }).notNull(),
    isActive: boolean("is_active").default(true).notNull()
  },
  (t) => [unique().on(t.wardId, t.roomNumber)]
);

export const beds = pgTable(
  "beds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .references(() => rooms.id)
      .notNull(),
    bedNumber: varchar("bed_number", { length: 50 }).notNull(),
    status: bedStatusEnum("status").default("available").notNull(),
    isActive: boolean("is_active").default(true).notNull()
  },
  (t) => [
    index("idx_beds_available")
      .on(t.status)
      .where(sql`status = 'available'`),
    unique().on(t.roomId, t.bedNumber)
  ]
);

export const admissions = pgTable(
  "admissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    admissionNumber: varchar("admission_number", { length: 50 }).notNull().unique(),
    patientId: uuid("patient_id")
      .references(() => patients.id)
      .notNull(),
    attendingDoctorId: uuid("attending_doctor_id")
      .references(() => doctors.id)
      .notNull(),
    status: admissionStatusEnum("status").default("admitted").notNull(),
    admissionReason: varchar("admission_reason", { length: 500 }).notNull(),
    admittedAt: timestamp("admitted_at", { withTimezone: true }).defaultNow().notNull(),
    expectedDischargeAt: timestamp("expected_discharge_at", { withTimezone: true }),
    dischargedAt: timestamp("discharged_at", { withTimezone: true }),
    dischargeSummary: varchar("discharge_summary", { length: 2000 }),
    createdBy: text("created_by")
      .references(() => user.id)
      .notNull(),
    ...timestamps
  },
  (t) => [
    index("idx_admissions_active")
      .on(t.patientId, t.admittedAt.desc())
      .where(sql`status = 'admitted'`),
    check(
      "admissions_discharge_consistency",
      sql`(status = 'discharged' AND discharged_at IS NOT NULL) OR (status <> 'discharged')`
    ),
    index("idx_admissions_doctor").on(t.attendingDoctorId, t.admittedAt.desc())
  ]
);

export const bedAllocations = pgTable(
  "bed_allocations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    admissionId: uuid("admission_id")
      .references(() => admissions.id)
      .notNull(),
    bedId: uuid("bed_id")
      .references(() => beds.id)
      .notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    allocatedBy: text("allocated_by")
      .references(() => user.id)
      .notNull(),
    endedBy: text("ended_by").references(() => user.id),
    transferReason: varchar("transfer_reason", { length: 500 })
  },
  (t) => [
    index("idx_bed_allocations_current")
      .on(t.bedId)
      .where(sql`ended_at IS NULL`)
  ]
);

export const clinicalNotes = pgTable(
  "clinical_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    admissionId: uuid("admission_id")
      .references(() => admissions.id)
      .notNull(),
    authorUserId: text("author_user_id")
      .references(() => user.id)
      .notNull(),
    noteType: clinicalNoteTypeEnum("note_type").notNull(),
    noteText: varchar("note_text", { length: 5000 }).notNull(),
    ...timestamps
  },
  (t) => [index("idx_clinical_notes_admission_created").on(t.admissionId, t.createdAt.desc())]
);
