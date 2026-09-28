CREATE TYPE "active_status" AS ENUM('active', 'inactive', 'suspended', 'archived');--> statement-breakpoint
CREATE TYPE "admission_status" AS ENUM('admitted', 'discharged', 'cancelled');--> statement-breakpoint
CREATE TYPE "allergy_category" AS ENUM('Medication', 'Food', 'Environmental', 'Other');--> statement-breakpoint
CREATE TYPE "allergy_severity" AS ENUM('Mild', 'Moderate', 'Severe', 'Anaphylactic');--> statement-breakpoint
CREATE TYPE "allergy_status" AS ENUM('Active', 'Resolved', 'Inactive');--> statement-breakpoint
CREATE TYPE "appointment_priority" AS ENUM('Normal', 'Urgent', 'Emergency');--> statement-breakpoint
CREATE TYPE "appointment_status" AS ENUM('scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "audit_action" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'LOGIN', 'RESTORE');--> statement-breakpoint
CREATE TYPE "audit_entity" AS ENUM('PATIENT', 'ENCOUNTER', 'IMMUNIZATION', 'PRESCRIPTION', 'LAB', 'INVOICE', 'PAYMENT', 'ADMISSION', 'USER', 'DATABASE');--> statement-breakpoint
CREATE TYPE "bed_status" AS ENUM('available', 'occupied', 'maintenance');--> statement-breakpoint
CREATE TYPE "blood_group" AS ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown');--> statement-breakpoint
CREATE TYPE "clinical_note_type" AS ENUM('Progress', 'Admission', 'Discharge', 'Consultation', 'Nursing', 'Procedure', 'Other');--> statement-breakpoint
CREATE TYPE "condition_severity" AS ENUM('Mild', 'Moderate', 'Severe');--> statement-breakpoint
CREATE TYPE "condition_status" AS ENUM('Active', 'Resolved', 'In Remission');--> statement-breakpoint
CREATE TYPE "delivery_method" AS ENUM('Vaginal', 'Cesarean', 'Assisted');--> statement-breakpoint
CREATE TYPE "document_type" AS ENUM('id_proof', 'lab_report', 'prescription', 'other');--> statement-breakpoint
CREATE TYPE "encounter_status" AS ENUM('in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "guardian_relationship" AS ENUM('Mother', 'Father', 'Grandparent', 'Legal Guardian', 'Foster Parent', 'Other');--> statement-breakpoint
CREATE TYPE "immunization_status" AS ENUM('Administered', 'Due', 'Overdue', 'Upcoming', 'Deferred', 'Refused');--> statement-breakpoint
CREATE TYPE "inventory_transaction_type" AS ENUM('receive', 'dispense', 'adjustment', 'return');--> statement-breakpoint
CREATE TYPE "invoice_status" AS ENUM('draft', 'issued', 'partially_paid', 'paid', 'void');--> statement-breakpoint
CREATE TYPE "lab_order_status" AS ENUM('ordered', 'collected', 'processing', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "lab_priority" AS ENUM('Routine', 'Urgent', 'Stat');--> statement-breakpoint
CREATE TYPE "lab_test_flag" AS ENUM('Normal', 'Abnormal', 'Critical');--> statement-breakpoint
CREATE TYPE "medical_record_status" AS ENUM('Active', 'Archived', 'Superseded');--> statement-breakpoint
CREATE TYPE "medical_record_type" AS ENUM('Lab Report', 'Imaging', 'Referral', 'Discharge Summary', 'Consent Form', 'Insurance', 'Operative Report', 'Pathology', 'External Record', 'Other');--> statement-breakpoint
CREATE TYPE "metric_type" AS ENUM('weight', 'height', 'head_circumference', 'bmi');--> statement-breakpoint
CREATE TYPE "pain_scale_type" AS ENUM('Wong-Baker', 'Numeric', 'FLACC', 'Neonatal');--> statement-breakpoint
CREATE TYPE "payment_method" AS ENUM('cash', 'card', 'bank_transfer', 'insurance', 'other');--> statement-breakpoint
CREATE TYPE "payment_status" AS ENUM('pending', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "prescription_status" AS ENUM('active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "role" AS ENUM('admin', 'doctor', 'staff', 'patient', 'nurse', 'pharmacist', 'labTech', 'receptionist', 'accountant');--> statement-breakpoint
CREATE TYPE "room_type" AS ENUM('Private', 'Semi-Private', 'Ward', 'Isolation');--> statement-breakpoint
CREATE TYPE "staff_role" AS ENUM('admin', 'doctor', 'staff');--> statement-breakpoint
CREATE TYPE "temperature_method" AS ENUM('Axillary', 'Oral', 'Rectal', 'Tympanic', 'Temporal');--> statement-breakpoint
CREATE TYPE "user_status" AS ENUM('active', 'inactive', 'suspended');--> statement-breakpoint
CREATE TYPE "visit_type" AS ENUM('Well-Child Check', 'Sick Visit', 'Follow-Up', 'Immunization Visit', 'Consultation', 'Lactation Consultation', 'Emergency/Urgent', 'Telehealth', 'Other');--> statement-breakpoint
CREATE TYPE "ward_type" AS ENUM('Pediatric', 'NICU', 'PICU', 'General', 'Isolation');--> statement-breakpoint
CREATE TYPE "who_gender" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"slug" text UNIQUE,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "user_admin" (
	"user_id" text PRIMARY KEY,
	"role" text DEFAULT 'user' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"ban_reason" text,
	"ban_expires" timestamp
);
--> statement-breakpoint
CREATE TABLE "charge_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(50) NOT NULL UNIQUE,
	"name" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"default_amount" numeric(10,2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"expense_number" varchar(50) NOT NULL UNIQUE,
	"category" varchar(100) NOT NULL,
	"description" varchar(500) NOT NULL,
	"amount" numeric(12,2) NOT NULL,
	"expense_date" date NOT NULL,
	"payment_method" varchar(50),
	"vendor_name" varchar(255),
	"reference_number" varchar(255),
	"recorded_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"invoice_id" uuid NOT NULL,
	"source_type" varchar(50),
	"source_id" uuid,
	"description_snapshot" varchar(255) NOT NULL,
	"quantity" numeric(10,2) NOT NULL,
	"unit_price" numeric(12,2) NOT NULL,
	"discount_amount" numeric(12,2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(12,2) DEFAULT '0' NOT NULL,
	"line_total" numeric(12,2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"invoice_number" varchar(50) NOT NULL UNIQUE,
	"patient_id" uuid NOT NULL,
	"encounter_id" uuid,
	"admission_id" uuid,
	"status" "invoice_status" DEFAULT 'draft'::"invoice_status" NOT NULL,
	"currency_code" varchar(10) DEFAULT 'USD' NOT NULL,
	"subtotal" numeric(12,2) DEFAULT '0' NOT NULL,
	"discount_total" numeric(12,2) DEFAULT '0' NOT NULL,
	"tax_total" numeric(12,2) DEFAULT '0' NOT NULL,
	"grand_total" numeric(12,2) DEFAULT '0' NOT NULL,
	"amount_paid" numeric(12,2) DEFAULT '0' NOT NULL,
	"balance_due" numeric(12,2) DEFAULT '0' NOT NULL,
	"issued_at" timestamp with time zone,
	"due_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"payment_number" varchar(50) NOT NULL UNIQUE,
	"invoice_id" uuid NOT NULL,
	"amount" numeric(12,2) NOT NULL,
	"payment_method" "payment_method",
	"status" "payment_status" DEFAULT 'completed'::"payment_status" NOT NULL,
	"transaction_reference" varchar(255),
	"received_by" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"note" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"actor_user_id" text,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" text,
	"metadata" jsonb,
	"ip_address" varchar(45),
	"user_agent" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinic_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"hospital_name" varchar(255) NOT NULL,
	"registration_number" varchar(100),
	"phone" varchar(50),
	"email" varchar(255),
	"address_line1" varchar(255),
	"address_line2" varchar(255),
	"city" varchar(100),
	"state" varchar(100),
	"postal_code" varchar(20),
	"country" varchar(100),
	"timezone" varchar(50) DEFAULT 'UTC' NOT NULL,
	"currency_code" varchar(10) DEFAULT 'USD' NOT NULL,
	"invoice_prefix" varchar(10) DEFAULT 'INV-',
	"patient_prefix" varchar(10) DEFAULT 'PT-',
	"appointment_prefix" varchar(10) DEFAULT 'APT-',
	"admission_prefix" varchar(10) DEFAULT 'ADM-',
	"lab_order_prefix" varchar(10) DEFAULT 'LAB-',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"address" text,
	"phone" text,
	"email" text,
	"website" text,
	"logo" text,
	"timezone" text DEFAULT 'UTC',
	"currency" text DEFAULT 'USD',
	"active" boolean DEFAULT true NOT NULL,
	"settings" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(50) NOT NULL UNIQUE,
	"name" varchar(100) NOT NULL UNIQUE,
	"description" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"appointment_number" varchar(50) NOT NULL UNIQUE,
	"patient_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"scheduled_start" timestamp with time zone NOT NULL,
	"scheduled_end" timestamp with time zone NOT NULL,
	"status" "appointment_status" DEFAULT 'scheduled'::"appointment_status" NOT NULL,
	"reason" varchar(255),
	"type" "visit_type" NOT NULL,
	"priority" "appointment_priority" DEFAULT 'Normal'::"appointment_priority",
	"notes" text,
	"booked_by" text NOT NULL,
	"cancellation_reason" text,
	"checked_in_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diagnoses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"encounter_id" uuid NOT NULL,
	"code" varchar(50),
	"description" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctor_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"doctor_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"slot_duration_minutes" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "doctor_schedules_doctor_id_day_of_week_start_time_unique" UNIQUE("doctor_id","day_of_week","start_time")
);
--> statement-breakpoint
CREATE TABLE "doctors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"staff_id" uuid NOT NULL UNIQUE,
	"department_id" uuid NOT NULL,
	"doctor_code" varchar(50) NOT NULL UNIQUE,
	"registration_number" varchar(100) NOT NULL UNIQUE,
	"specialization" varchar(255) NOT NULL,
	"qualification" varchar(255),
	"consultation_fee" numeric(10,2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "encounters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"patient_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"appointment_id" uuid UNIQUE,
	"encounter_number" varchar(50) NOT NULL UNIQUE,
	"status" "encounter_status" DEFAULT 'in_progress'::"encounter_status" NOT NULL,
	"chief_complaint" text NOT NULL,
	"history" text,
	"examination_notes" text,
	"diagnosis_summary" text,
	"temperature_c" real NOT NULL,
	"temperature_method" "temperature_method" DEFAULT 'Axillary'::"temperature_method",
	"systolic_bp" integer,
	"diastolic_bp" integer,
	"oxygen_saturation_percent" integer NOT NULL,
	"pain_score" integer DEFAULT 0,
	"pain_scale_type" "pain_scale_type" DEFAULT 'Wong-Baker'::"pain_scale_type",
	"weight_kg" real,
	"height_cm" real,
	"head_circumference_cm" real,
	"bmi" real,
	"notes" text,
	"treatment_plan" text,
	"follow_up_at" timestamp with time zone,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "growth_measurements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"patient_id" uuid NOT NULL,
	"encounter_id" uuid,
	"recorded_at" timestamp with time zone NOT NULL,
	"age_months" real NOT NULL,
	"age_days" integer,
	"weight_kg" real NOT NULL,
	"height_cm" real NOT NULL,
	"head_circ_cm" real,
	"bmi" real NOT NULL,
	"weight_for_age_zscore" real,
	"weight_for_age_percentile" real,
	"height_for_age_zscore" real,
	"height_for_age_percentile" real,
	"bmi_for_age_zscore" real,
	"bmi_for_age_percentile" real,
	"head_circ_zscore" real,
	"head_circ_percentile" real,
	"weight_velocity" real,
	"height_velocity" real,
	"recorded_by" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prescription_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"prescription_id" uuid NOT NULL,
	"medicine_id" uuid,
	"medicine_name_snapshot" varchar(255) NOT NULL,
	"dosage" varchar(100) NOT NULL,
	"route" varchar(100),
	"frequency" varchar(100) NOT NULL,
	"duration" varchar(100) NOT NULL,
	"quantity" integer,
	"instructions" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prescriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"prescription_number" varchar(50) NOT NULL UNIQUE,
	"encounter_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"prescriber_id" uuid NOT NULL,
	"status" "prescription_status" DEFAULT 'active'::"prescription_status" NOT NULL,
	"prescriber_name" text NOT NULL,
	"prescriber_license" text NOT NULL,
	"patient_weight_kg" real NOT NULL,
	"diagnosis" text,
	"notes" text,
	"filled_at" timestamp with time zone,
	"filled_by" text,
	"discontinued_at" timestamp with time zone,
	"discontinued_reason" text,
	"prescribed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"title" text NOT NULL,
	"role" "staff_role" NOT NULL,
	"license_number" text NOT NULL,
	"avatar_color" text NOT NULL,
	"pin_hash" text NOT NULL,
	"clinic_id" uuid,
	"phone" varchar(32),
	"bio" text,
	"user_id" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"is_active" boolean DEFAULT true NOT NULL,
	"specialty" text DEFAULT 'General Pediatrics',
	"department" text DEFAULT 'General',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "immunizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"patient_id" uuid NOT NULL,
	"vaccine_code" text NOT NULL,
	"vaccine_name" text NOT NULL,
	"target_disease" text NOT NULL,
	"dose_number" integer NOT NULL,
	"total_doses" integer,
	"recommended_age_label" text NOT NULL,
	"recommended_age_months" real NOT NULL,
	"due_date" date NOT NULL,
	"administered_date" date,
	"status" "immunization_status" DEFAULT 'Due'::"immunization_status" NOT NULL,
	"manufacturer" text,
	"brand_name" text,
	"batch_number" text,
	"expiry_date" date,
	"administration_site" text,
	"administration_route" text,
	"administered_by" text,
	"adverse_reactions" text,
	"parent_consent" boolean DEFAULT false,
	"consent_form_id" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medical_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"patient_id" uuid NOT NULL,
	"encounter_id" uuid,
	"uploaded_by" uuid NOT NULL,
	"record_type" "medical_record_type" NOT NULL,
	"status" "medical_record_status" DEFAULT 'Active'::"medical_record_status" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"file_url" text NOT NULL,
	"file_name" text NOT NULL,
	"file_mime_type" text NOT NULL,
	"file_size_bytes" integer,
	"external_id" text,
	"external_system" text,
	"document_date" date,
	"metadata" jsonb DEFAULT '{}',
	"tags" text[] DEFAULT '{}'::text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "who_growth_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"gender" "who_gender" NOT NULL,
	"metric_type" "metric_type" NOT NULL,
	"age_days" integer,
	"age_months" real NOT NULL,
	"l_value" real NOT NULL,
	"m_value" real NOT NULL,
	"s_value" real NOT NULL,
	"sd_4neg" real,
	"sd_3neg" real,
	"sd_2neg" real,
	"sd_1neg" real,
	"sd_0" real,
	"sd_1" real,
	"sd_2" real,
	"sd_3" real,
	"sd_4" real,
	"data_source" text DEFAULT 'WHO',
	"version" text DEFAULT '2006',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"admission_number" varchar(50) NOT NULL UNIQUE,
	"patient_id" uuid NOT NULL,
	"attending_doctor_id" uuid NOT NULL,
	"status" "admission_status" DEFAULT 'admitted'::"admission_status" NOT NULL,
	"admission_reason" varchar(500) NOT NULL,
	"admitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expected_discharge_at" timestamp with time zone,
	"discharged_at" timestamp with time zone,
	"discharge_summary" varchar(2000),
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admissions_discharge_consistency" CHECK ((status = 'discharged' AND discharged_at IS NOT NULL) OR (status <> 'discharged'))
);
--> statement-breakpoint
CREATE TABLE "bed_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"admission_id" uuid NOT NULL,
	"bed_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"allocated_by" text NOT NULL,
	"ended_by" text,
	"transfer_reason" varchar(500)
);
--> statement-breakpoint
CREATE TABLE "beds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"room_id" uuid NOT NULL,
	"bed_number" varchar(50) NOT NULL,
	"status" "bed_status" DEFAULT 'available'::"bed_status" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "beds_room_id_bed_number_unique" UNIQUE("room_id","bed_number")
);
--> statement-breakpoint
CREATE TABLE "clinical_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"admission_id" uuid NOT NULL,
	"author_user_id" text NOT NULL,
	"note_type" "clinical_note_type" NOT NULL,
	"note_text" varchar(5000) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"ward_id" uuid NOT NULL,
	"room_number" varchar(50) NOT NULL,
	"room_type" varchar(50) NOT NULL,
	"daily_rate" numeric(10,2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "rooms_ward_id_room_number_unique" UNIQUE("ward_id","room_number")
);
--> statement-breakpoint
CREATE TABLE "wards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(50) NOT NULL UNIQUE,
	"name" varchar(100) NOT NULL UNIQUE,
	"type" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lab_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"lab_order_id" uuid NOT NULL,
	"lab_test_id" uuid NOT NULL,
	"test_name_snapshot" varchar(255) NOT NULL,
	"price_snapshot" numeric(10,2) NOT NULL,
	"status" "lab_order_status" DEFAULT 'ordered'::"lab_order_status" NOT NULL,
	"result_value" varchar(255),
	"result_text" varchar(2000),
	"reference_range_snapshot" varchar(255),
	"unit_snapshot" varchar(50),
	"resulted_by_user_id" text,
	"resulted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "lab_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"lab_order_number" varchar(50) NOT NULL UNIQUE,
	"patient_id" uuid NOT NULL,
	"encounter_id" uuid,
	"admission_id" uuid,
	"ordered_by_doctor_id" uuid NOT NULL,
	"status" "lab_order_status" DEFAULT 'ordered'::"lab_order_status" NOT NULL,
	"ordered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"collected_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lab_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(50) NOT NULL UNIQUE,
	"name" varchar(255) NOT NULL,
	"description" varchar(1000),
	"sample_type" varchar(100),
	"price" numeric(10,2) NOT NULL,
	"reference_range" varchar(255),
	"unit" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guardians" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"patient_id" uuid NOT NULL,
	"name" text NOT NULL,
	"user_id" text,
	"relationship" "guardian_relationship" NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"address" text,
	"is_primary" boolean DEFAULT true NOT NULL,
	"emergency_contact" boolean DEFAULT true NOT NULL,
	"contact_order" integer DEFAULT 1,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_allergies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"patient_id" uuid NOT NULL,
	"allergen" text NOT NULL,
	"category" "allergy_category" NOT NULL,
	"severity" "allergy_severity" NOT NULL,
	"status" "allergy_status" DEFAULT 'Active'::"allergy_status" NOT NULL,
	"reaction" text NOT NULL,
	"identified_date" date,
	"onset_date" date,
	"resolution_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_chronic_conditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"patient_id" uuid NOT NULL,
	"condition" text NOT NULL,
	"icd_code" text,
	"diagnosed_date" date NOT NULL,
	"status" "condition_status" DEFAULT 'Active'::"condition_status" NOT NULL,
	"severity" "condition_severity",
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"patient_id" uuid NOT NULL,
	"document_type" "document_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"storage_key" varchar(500) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size_bytes" integer NOT NULL,
	"uploaded_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"mrn" text NOT NULL UNIQUE,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"date_of_birth" date NOT NULL,
	"phone" varchar(50) NOT NULL,
	"alternate_phone" varchar(50),
	"email" varchar(255),
	"address_line1" varchar(255) NOT NULL,
	"address_line2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"postal_code" varchar(20) NOT NULL,
	"country" varchar(100) NOT NULL,
	"emergency_contact_name" varchar(100) NOT NULL,
	"emergency_contact_relationship" varchar(100) NOT NULL,
	"emergency_contact_phone" varchar(50) NOT NULL,
	"medical_alerts" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"gender" "gender" NOT NULL,
	"blood_group" "blood_group" DEFAULT 'Unknown'::"blood_group" NOT NULL,
	"birth_weight_kg" real,
	"birth_length_cm" real,
	"birth_head_circ_cm" real,
	"delivery_method" "delivery_method",
	"preferred_language" text DEFAULT 'English',
	"active_status" "active_status" DEFAULT 'active'::"active_status" NOT NULL,
	"notes" text,
	"user_id" text NOT NULL,
	"pediatrician_id" uuid,
	"clinic_id" uuid
);
--> statement-breakpoint
CREATE TABLE "dispensation_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"dispensation_id" uuid NOT NULL,
	"prescription_item_id" uuid NOT NULL,
	"medicine_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price_snapshot" numeric(10,2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dispensations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"prescription_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"dispensed_by" text NOT NULL,
	"dispensed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"medicine_id" uuid NOT NULL,
	"batch_id" uuid,
	"transaction_type" "inventory_transaction_type" NOT NULL,
	"quantity_delta" integer NOT NULL,
	"reference_type" varchar(100) NOT NULL,
	"reference_id" uuid,
	"note" varchar(500),
	"performed_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medicine_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"medicine_id" uuid NOT NULL,
	"batch_number" varchar(100) NOT NULL,
	"expiry_date" date NOT NULL,
	"purchase_price" numeric(10,2) NOT NULL,
	"sale_price" numeric(10,2) NOT NULL,
	"quantity_received" integer NOT NULL,
	"quantity_available" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "medicine_batches_medicine_id_batch_number_unique" UNIQUE("medicine_id","batch_number"),
	CONSTRAINT "medicine_batches_qty_nonneg" CHECK (quantity_available >= 0 AND quantity_received >= 0)
);
--> statement-breakpoint
CREATE TABLE "medicines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(50) NOT NULL UNIQUE,
	"generic_name" varchar(255) NOT NULL,
	"brand_name" varchar(255),
	"dosage_form" varchar(100) NOT NULL,
	"strength" varchar(100) NOT NULL,
	"manufacturer" varchar(255),
	"reorder_level" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "active_organization_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "password_hash" varchar(255);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "phone" varchar(50);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "status" "user_status" DEFAULT 'active'::"user_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "last_login_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" "role" DEFAULT 'patient'::"role";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "clinic_id" uuid;--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
CREATE INDEX "invitation_organizationId_idx" ON "invitation" ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" ("email");--> statement-breakpoint
CREATE INDEX "member_organizationId_idx" ON "member" ("organization_id");--> statement-breakpoint
CREATE INDEX "member_userId_idx" ON "member" ("user_id");--> statement-breakpoint
CREATE INDEX "organization_slug_idx" ON "organization" ("slug");--> statement-breakpoint
CREATE INDEX "idx_charge_catalog_category" ON "charge_catalog" ("category");--> statement-breakpoint
CREATE INDEX "idx_charge_catalog_active" ON "charge_catalog" ("is_active");--> statement-breakpoint
CREATE INDEX "idx_invoice_items_invoice" ON "invoice_items" ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_patient_issued" ON "invoices" ("patient_id","issued_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_invoices_status_due" ON "invoices" ("status","due_at");--> statement-breakpoint
CREATE INDEX "idx_invoices_encounter" ON "invoices" ("encounter_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_admission" ON "invoices" ("admission_id");--> statement-breakpoint
CREATE INDEX "idx_payments_invoice" ON "payments" ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_payments_received_at" ON "payments" ("received_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_logs" ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_logs" ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_action_idx" ON "audit_logs" ("action");--> statement-breakpoint
CREATE INDEX "audit_created_at_idx" ON "audit_logs" ("created_at");--> statement-breakpoint
CREATE INDEX "idx_clinics_name" ON "clinics" ("name");--> statement-breakpoint
CREATE INDEX "idx_clinics_active" ON "clinics" ("active");--> statement-breakpoint
CREATE INDEX "idx_appointments_doctor_start" ON "appointments" ("doctor_id","scheduled_start");--> statement-breakpoint
CREATE INDEX "idx_appointments_patient_start" ON "appointments" ("patient_id","scheduled_start");--> statement-breakpoint
CREATE INDEX "idx_appointments_status_start" ON "appointments" ("status","scheduled_start");--> statement-breakpoint
CREATE INDEX "idx_appointments_patient_status" ON "appointments" ("patient_id","status");--> statement-breakpoint
CREATE INDEX "idx_diagnoses_encounter" ON "diagnoses" ("encounter_id");--> statement-breakpoint
CREATE INDEX "idx_diagnoses_code" ON "diagnoses" ("code");--> statement-breakpoint
CREATE INDEX "idx_doctor_schedules_doctor" ON "doctor_schedules" ("doctor_id");--> statement-breakpoint
CREATE INDEX "idx_doctors_department" ON "doctors" ("department_id");--> statement-breakpoint
CREATE INDEX "idx_doctors_active" ON "doctors" ("is_active");--> statement-breakpoint
CREATE INDEX "idx_encounters_patient_started" ON "encounters" ("patient_id","started_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_encounters_doctor_started" ON "encounters" ("doctor_id","started_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_growth_patient_recorded" ON "growth_measurements" ("patient_id","recorded_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_growth_patient_age" ON "growth_measurements" ("patient_id","age_months");--> statement-breakpoint
CREATE INDEX "idx_growth_encounter" ON "growth_measurements" ("encounter_id");--> statement-breakpoint
CREATE INDEX "idx_prescription_items_prescription" ON "prescription_items" ("prescription_id");--> statement-breakpoint
CREATE INDEX "idx_prescription_items_medicine" ON "prescription_items" ("medicine_id");--> statement-breakpoint
CREATE INDEX "idx_prescriptions_patient_active" ON "prescriptions" ("patient_id") WHERE status = 'active';--> statement-breakpoint
CREATE INDEX "idx_prescriptions_patient_status" ON "prescriptions" ("patient_id","status");--> statement-breakpoint
CREATE INDEX "idx_prescriptions_prescriber" ON "prescriptions" ("prescriber_id");--> statement-breakpoint
CREATE INDEX "idx_prescriptions_doctor_prescribed" ON "prescriptions" ("doctor_id","prescribed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_prescriptions_encounter" ON "prescriptions" ("encounter_id");--> statement-breakpoint
CREATE INDEX "idx_staff_role" ON "staff" ("role");--> statement-breakpoint
CREATE INDEX "idx_staff_is_active" ON "staff" ("is_active");--> statement-breakpoint
CREATE INDEX "idx_staff_user_id" ON "staff" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_staff_clinic" ON "staff" ("clinic_id");--> statement-breakpoint
CREATE INDEX "idx_immunizations_patient_administered" ON "immunizations" ("patient_id","administered_date");--> statement-breakpoint
CREATE INDEX "idx_immunizations_patient_status" ON "immunizations" ("patient_id","status");--> statement-breakpoint
CREATE INDEX "idx_immunizations_due_date" ON "immunizations" ("due_date");--> statement-breakpoint
CREATE INDEX "idx_immunizations_vaccine_code" ON "immunizations" ("vaccine_code");--> statement-breakpoint
CREATE INDEX "idx_medical_records_patient_type" ON "medical_records" ("patient_id","record_type");--> statement-breakpoint
CREATE INDEX "idx_medical_records_patient_status" ON "medical_records" ("patient_id","status");--> statement-breakpoint
CREATE INDEX "idx_medical_records_encounter" ON "medical_records" ("encounter_id");--> statement-breakpoint
CREATE INDEX "idx_medical_records_external" ON "medical_records" ("external_system","external_id");--> statement-breakpoint
CREATE INDEX "idx_medical_records_uploaded_by" ON "medical_records" ("uploaded_by");--> statement-breakpoint
CREATE UNIQUE INDEX "who_gender_metric_age_idx" ON "who_growth_data" ("gender","metric_type","age_months");--> statement-breakpoint
CREATE INDEX "idx_admissions_active" ON "admissions" ("patient_id","admitted_at" DESC NULLS LAST) WHERE status = 'admitted';--> statement-breakpoint
CREATE INDEX "idx_admissions_doctor" ON "admissions" ("attending_doctor_id","admitted_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_bed_allocations_current" ON "bed_allocations" ("bed_id") WHERE ended_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_beds_available" ON "beds" ("status") WHERE status = 'available';--> statement-breakpoint
CREATE INDEX "idx_clinical_notes_admission_created" ON "clinical_notes" ("admission_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_lab_order_items_order" ON "lab_order_items" ("lab_order_id");--> statement-breakpoint
CREATE INDEX "idx_lab_order_items_test" ON "lab_order_items" ("lab_test_id");--> statement-breakpoint
CREATE INDEX "idx_lab_orders_patient_ordered" ON "lab_orders" ("patient_id","ordered_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_lab_orders_status_ordered" ON "lab_orders" ("status","ordered_at");--> statement-breakpoint
CREATE INDEX "idx_lab_tests_active" ON "lab_tests" ("is_active");--> statement-breakpoint
CREATE INDEX "idx_guardians_patient_primary" ON "guardians" ("patient_id","is_primary");--> statement-breakpoint
CREATE INDEX "idx_guardians_user_id" ON "guardians" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_allergies_patient_status" ON "patient_allergies" ("patient_id","status");--> statement-breakpoint
CREATE INDEX "idx_allergies_category" ON "patient_allergies" ("category");--> statement-breakpoint
CREATE INDEX "idx_allergies_severity" ON "patient_allergies" ("severity");--> statement-breakpoint
CREATE INDEX "idx_conditions_patient_status" ON "patient_chronic_conditions" ("patient_id","status");--> statement-breakpoint
CREATE INDEX "idx_conditions_icd" ON "patient_chronic_conditions" ("icd_code");--> statement-breakpoint
CREATE INDEX "idx_patients_mrn" ON "patients" ("mrn");--> statement-breakpoint
CREATE INDEX "idx_patients_dob" ON "patients" ("date_of_birth");--> statement-breakpoint
CREATE INDEX "idx_patients_pediatrician_active" ON "patients" ("pediatrician_id","active_status");--> statement-breakpoint
CREATE INDEX "idx_patients_user_id" ON "patients" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_patients_clinic_id" ON "patients" ("clinic_id");--> statement-breakpoint
CREATE INDEX "idx_patients_name_active_partial" ON "patients" ("last_name","first_name") WHERE active_status = 'active';--> statement-breakpoint
CREATE INDEX "idx_dispensation_items_dispensation" ON "dispensation_items" ("dispensation_id");--> statement-breakpoint
CREATE INDEX "idx_dispensation_items_medicine" ON "dispensation_items" ("medicine_id");--> statement-breakpoint
CREATE INDEX "idx_dispensation_items_batch" ON "dispensation_items" ("batch_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_medicine_created" ON "inventory_transactions" ("medicine_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_inventory_batch" ON "inventory_transactions" ("batch_id");--> statement-breakpoint
CREATE INDEX "idx_medicine_batches_expiry" ON "medicine_batches" ("expiry_date");--> statement-breakpoint
CREATE INDEX "idx_medicines_active" ON "medicines" ("is_active");--> statement-breakpoint
CREATE INDEX "idx_medicines_generic_name" ON "medicines" ("generic_name");--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_clinic_id_clinics_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "user_admin" ADD CONSTRAINT "user_admin_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id");--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_patient_id_patients_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id");--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_encounter_id_encounters_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "encounters"("id");--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_admission_id_admissions_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "admissions"("id");--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_received_by_user_id_fkey" FOREIGN KEY ("received_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_patients_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id");--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_doctors_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id");--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_booked_by_user_id_fkey" FOREIGN KEY ("booked_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_encounter_id_encounters_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "encounters"("id");--> statement-breakpoint
ALTER TABLE "doctor_schedules" ADD CONSTRAINT "doctor_schedules_doctor_id_doctors_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id");--> statement-breakpoint
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_staff_id_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_department_id_departments_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id");--> statement-breakpoint
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_patient_id_patients_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id");--> statement-breakpoint
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_doctor_id_doctors_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id");--> statement-breakpoint
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_appointment_id_appointments_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id");--> statement-breakpoint
ALTER TABLE "growth_measurements" ADD CONSTRAINT "growth_measurements_patient_id_patients_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "growth_measurements" ADD CONSTRAINT "growth_measurements_encounter_id_encounters_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "encounters"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "growth_measurements" ADD CONSTRAINT "growth_measurements_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_prescription_id_prescriptions_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id");--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_encounter_id_encounters_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "encounters"("id");--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_patients_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id");--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_doctor_id_doctors_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id");--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_prescriber_id_staff_id_fkey" FOREIGN KEY ("prescriber_id") REFERENCES "staff"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_filled_by_user_id_fkey" FOREIGN KEY ("filled_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_clinic_id_clinics_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "immunizations" ADD CONSTRAINT "immunizations_patient_id_patients_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "immunizations" ADD CONSTRAINT "immunizations_administered_by_user_id_fkey" FOREIGN KEY ("administered_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_patient_id_patients_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_encounter_id_encounters_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "encounters"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_uploaded_by_staff_id_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "staff"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_patient_id_patients_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id");--> statement-breakpoint
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_attending_doctor_id_doctors_id_fkey" FOREIGN KEY ("attending_doctor_id") REFERENCES "doctors"("id");--> statement-breakpoint
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "bed_allocations" ADD CONSTRAINT "bed_allocations_admission_id_admissions_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "admissions"("id");--> statement-breakpoint
ALTER TABLE "bed_allocations" ADD CONSTRAINT "bed_allocations_bed_id_beds_id_fkey" FOREIGN KEY ("bed_id") REFERENCES "beds"("id");--> statement-breakpoint
ALTER TABLE "bed_allocations" ADD CONSTRAINT "bed_allocations_allocated_by_user_id_fkey" FOREIGN KEY ("allocated_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "bed_allocations" ADD CONSTRAINT "bed_allocations_ended_by_user_id_fkey" FOREIGN KEY ("ended_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "beds" ADD CONSTRAINT "beds_room_id_rooms_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id");--> statement-breakpoint
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_admission_id_admissions_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "admissions"("id");--> statement-breakpoint
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_author_user_id_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_ward_id_wards_id_fkey" FOREIGN KEY ("ward_id") REFERENCES "wards"("id");--> statement-breakpoint
ALTER TABLE "lab_order_items" ADD CONSTRAINT "lab_order_items_lab_order_id_lab_orders_id_fkey" FOREIGN KEY ("lab_order_id") REFERENCES "lab_orders"("id");--> statement-breakpoint
ALTER TABLE "lab_order_items" ADD CONSTRAINT "lab_order_items_lab_test_id_lab_tests_id_fkey" FOREIGN KEY ("lab_test_id") REFERENCES "lab_tests"("id");--> statement-breakpoint
ALTER TABLE "lab_order_items" ADD CONSTRAINT "lab_order_items_resulted_by_user_id_user_id_fkey" FOREIGN KEY ("resulted_by_user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_patient_id_patients_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id");--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_encounter_id_encounters_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "encounters"("id");--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_admission_id_admissions_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "admissions"("id");--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_ordered_by_doctor_id_doctors_id_fkey" FOREIGN KEY ("ordered_by_doctor_id") REFERENCES "doctors"("id");--> statement-breakpoint
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_patient_id_patients_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "patient_allergies" ADD CONSTRAINT "patient_allergies_patient_id_patients_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "patient_chronic_conditions" ADD CONSTRAINT "patient_chronic_conditions_patient_id_patients_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "patient_documents" ADD CONSTRAINT "patient_documents_patient_id_patients_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id");--> statement-breakpoint
ALTER TABLE "patient_documents" ADD CONSTRAINT "patient_documents_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_pediatrician_id_staff_id_fkey" FOREIGN KEY ("pediatrician_id") REFERENCES "staff"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_clinic_id_clinics_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "dispensation_items" ADD CONSTRAINT "dispensation_items_dispensation_id_dispensations_id_fkey" FOREIGN KEY ("dispensation_id") REFERENCES "dispensations"("id");--> statement-breakpoint
ALTER TABLE "dispensation_items" ADD CONSTRAINT "dispensation_items_nKNaimWiE3EV_fkey" FOREIGN KEY ("prescription_item_id") REFERENCES "prescription_items"("id");--> statement-breakpoint
ALTER TABLE "dispensation_items" ADD CONSTRAINT "dispensation_items_medicine_id_medicines_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("id");--> statement-breakpoint
ALTER TABLE "dispensation_items" ADD CONSTRAINT "dispensation_items_batch_id_medicine_batches_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "medicine_batches"("id");--> statement-breakpoint
ALTER TABLE "dispensations" ADD CONSTRAINT "dispensations_prescription_id_prescriptions_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id");--> statement-breakpoint
ALTER TABLE "dispensations" ADD CONSTRAINT "dispensations_patient_id_patients_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id");--> statement-breakpoint
ALTER TABLE "dispensations" ADD CONSTRAINT "dispensations_dispensed_by_user_id_fkey" FOREIGN KEY ("dispensed_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_medicine_id_medicines_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("id");--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_batch_id_medicine_batches_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "medicine_batches"("id");--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_performed_by_user_id_fkey" FOREIGN KEY ("performed_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "medicine_batches" ADD CONSTRAINT "medicine_batches_medicine_id_medicines_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("id");