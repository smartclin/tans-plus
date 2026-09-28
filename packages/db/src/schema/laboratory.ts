import {
  boolean,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

import { timestamps } from "#@/schema/_helper";

import { user } from "./auth";
import { doctors, encounters } from "./clinical";
import { labOrderStatusEnum } from "./common";
import { admissions } from "./inpatient";
import { patients } from "./patients";

export const labTests = pgTable(
  "lab_tests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: varchar("description", { length: 1000 }),
    sampleType: varchar("sample_type", { length: 100 }),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    referenceRange: varchar("reference_range", { length: 255 }),
    unit: varchar("unit", { length: 50 }),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps
  },
  (t) => [index("idx_lab_tests_active").on(t.isActive)]
);

export const labOrders = pgTable(
  "lab_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    labOrderNumber: varchar("lab_order_number", { length: 50 }).notNull().unique(),
    patientId: uuid("patient_id")
      .references(() => patients.id)
      .notNull(),
    encounterId: uuid("encounter_id").references(() => encounters.id),
    admissionId: uuid("admission_id").references(() => admissions.id),
    orderedByDoctorId: uuid("ordered_by_doctor_id")
      .references(() => doctors.id)
      .notNull(),
    status: labOrderStatusEnum("status").default("ordered").notNull(),
    orderedAt: timestamp("ordered_at", { withTimezone: true }).defaultNow().notNull(),
    collectedAt: timestamp("collected_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps
  },
  (t) => [
    index("idx_lab_orders_patient_ordered").on(t.patientId, t.orderedAt.desc()),
    index("idx_lab_orders_status_ordered").on(t.status, t.orderedAt)
  ]
);

export const labOrderItems = pgTable(
  "lab_order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    labOrderId: uuid("lab_order_id")
      .references(() => labOrders.id)
      .notNull(),
    labTestId: uuid("lab_test_id")
      .references(() => labTests.id)
      .notNull(),
    testNameSnapshot: varchar("test_name_snapshot", { length: 255 }).notNull(),
    priceSnapshot: numeric("price_snapshot", { precision: 10, scale: 2 }).notNull(),
    status: labOrderStatusEnum("status").default("ordered").notNull(),
    resultValue: varchar("result_value", { length: 255 }),
    resultText: varchar("result_text", { length: 2000 }),
    referenceRangeSnapshot: varchar("reference_range_snapshot", { length: 255 }),
    unitSnapshot: varchar("unit_snapshot", { length: 50 }),
    resultedByUserId: text("resulted_by_user_id").references(() => user.id),
    resultedAt: timestamp("resulted_at", { withTimezone: true })
  },
  (table) => [
    index("idx_lab_order_items_order").on(table.labOrderId),
    index("idx_lab_order_items_test").on(table.labTestId)
  ]
);
