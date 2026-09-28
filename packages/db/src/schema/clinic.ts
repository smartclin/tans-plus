import { boolean, index, jsonb, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";

import { timestamps } from "#@/schema/_helper";
import { user } from "#@/schema/auth";

export const clinics = pgTable(
  "clinics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    address: text("address"),
    phone: text("phone"),
    email: text("email"),
    website: text("website"),
    logo: text("logo"),
    timezone: text("timezone").default("UTC"),
    currency: text("currency").default("USD"),
    active: boolean("active").notNull().default(true),
    settings: jsonb("settings").default({}),
    ...timestamps
  },
  (table) => [
    index("idx_clinics_name").on(table.name),
    index("idx_clinics_active").on(table.active)
  ]
);
export const clinicSettings = pgTable("clinic_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  hospitalName: varchar("hospital_name", { length: 255 }).notNull(),
  registrationNumber: varchar("registration_number", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  addressLine1: varchar("address_line1", { length: 255 }),
  addressLine2: varchar("address_line2", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  country: varchar("country", { length: 100 }),
  timezone: varchar("timezone", { length: 50 }).default("UTC").notNull(),
  currencyCode: varchar("currency_code", { length: 10 }).default("USD").notNull(),
  invoicePrefix: varchar("invoice_prefix", { length: 10 }).default("INV-"),
  patientPrefix: varchar("patient_prefix", { length: 10 }).default("PT-"),
  appointmentPrefix: varchar("appointment_prefix", { length: 10 }).default("APT-"),
  admissionPrefix: varchar("admission_prefix", { length: 10 }).default("ADM-"),
  labOrderPrefix: varchar("lab_order_prefix", { length: 10 }).default("LAB-"),
  ...timestamps
});

export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: varchar("description", { length: 500 }),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorUserId: text("actor_user_id").references(() => user.id),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 100 }).notNull(),
    entityId: text("entity_id"),
    metadata: jsonb("metadata"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: varchar("user_agent", { length: 1000 }),
    ...timestamps
  },
  (t) => [
    index("audit_actor_idx").on(t.actorUserId),
    index("audit_entity_idx").on(t.entityType, t.entityId),
    index("audit_action_idx").on(t.action),
    index("audit_created_at_idx").on(t.createdAt)
  ]
);
