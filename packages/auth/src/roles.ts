// lib/permissions.ts
import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/organization/access";

// ============================================================================
// 1. Statement — the resource × action matrix
// ============================================================================

export const statements = {
  ...defaultStatements,
  // ─── Hospital-specific resources ────────────────────────────
  patient: ["create", "read", "update", "delete", "archive"],
  encounter: ["create", "read", "update", "complete"],
  appointment: ["create", "read", "update", "cancel", "checkIn"],
  prescription: ["create", "read", "discontinue", "dispense"],
  immunization: ["create", "read", "administer", "defer"],
  growthMeasurement: ["create", "read", "update"],
  admission: ["create", "read", "update", "discharge"],
  bed: ["allocate", "transfer", "release"],
  labOrder: ["create", "read", "collect", "result", "cancel"],
  invoice: ["create", "read", "issue", "void"],
  payment: ["create", "read", "refund"],
  expense: ["create", "read", "update"],
  medicine: ["create", "read", "update", "receive", "adjust"],
  dispensation: ["create", "read"],
  staff: ["create", "read", "update", "deactivate"],
  doctor: ["create", "read", "update", "deactivate"],
  department: ["create", "read", "update", "deactivate"],
  report: ["read", "export"],
  audit: ["read", "export"]
} as const;

export const ac = createAccessControl(statements);

// ============================================================================
// 2. Roles
// ============================================================================

export const admin = ac.newRole({
  ...adminAc.statements
});

export const doctor = ac.newRole({
  // Clinical scope
  patient: ["create", "read", "update"],
  encounter: ["create", "read", "update", "complete"],
  appointment: ["create", "read", "update", "cancel", "checkIn"],
  prescription: ["create", "read", "discontinue"],
  immunization: ["create", "read", "administer", "defer"],
  growthMeasurement: ["create", "read", "update"],
  admission: ["create", "read", "update", "discharge"],
  bed: ["allocate", "transfer", "release"],
  labOrder: ["create", "read", "collect", "result"],
  medicine: ["read"],
  dispensation: ["read"],
  report: ["read"]
});

export const nurse = ac.newRole({
  patient: ["read", "update"],
  encounter: ["read", "update"],
  appointment: ["read", "checkIn"],
  immunization: ["create", "read", "administer", "defer"],
  growthMeasurement: ["create", "read", "update"],
  admission: ["read", "update"],
  bed: ["allocate", "transfer", "release"],
  labOrder: ["read", "collect"],
  medicine: ["read"],
  dispensation: ["read"]
});

export const pharmacist = ac.newRole({
  patient: ["read"],
  prescription: ["read", "dispense"],
  medicine: ["create", "read", "update", "receive", "adjust"],
  dispensation: ["create", "read"]
});

export const labTech = ac.newRole({
  patient: ["read"],
  labOrder: ["read", "collect", "result"]
});

export const receptionist = ac.newRole({
  patient: ["create", "read", "update"],
  appointment: ["create", "read", "update", "cancel", "checkIn"],
  invoice: ["create", "read", "issue"],
  payment: ["create", "read"]
});

export const accountant = ac.newRole({
  patient: ["read"],
  invoice: ["create", "read", "issue", "void"],
  payment: ["create", "read", "refund"],
  expense: ["create", "read", "update"],
  report: ["read", "export"],
  audit: ["read"]
});

export const patient = ac.newRole({
  patient: ["read"],
  appointment: ["read"],
  prescription: ["read"],
  immunization: ["read"],
  growthMeasurement: ["read"],
  labOrder: ["read"],
  invoice: ["read"],
  payment: ["read"]
});

// ============================================================================
// 3. Role registry
// ============================================================================

export const roles = {
  admin,
  doctor,
  nurse,
  pharmacist,
  labTech,
  receptionist,
  accountant,
  patient
} as const;

export type UserRole = keyof typeof roles;

// ============================================================================
// 4. Static permission map (source of truth for UI + checks)
// ============================================================================

/**
 * Static, hand-maintained map of what each role can do.
 * This is the source of truth for:
 *   - UI rendering (hide buttons the user can't use)
 *   - `getEffectivePermissions()` (avoid parsing `ac.newRole()` objects)
 *   - Unit tests
 *
 * Keep in sync with the `ac.newRole({...})` declarations above.
 */
export const rolePermissionsMap: Record<
  UserRole,
  Partial<{
    [K in keyof typeof statements]: readonly (typeof statements)[K][number][];
  }>
> = {
  admin: {
    ...adminAc.statements
  },
  doctor: {
    patient: ["create", "read", "update"],
    encounter: ["create", "read", "update", "complete"],
    appointment: ["create", "read", "update", "cancel", "checkIn"],
    prescription: ["create", "read", "discontinue"],
    immunization: ["create", "read", "administer", "defer"],
    growthMeasurement: ["create", "read", "update"],
    admission: ["create", "read", "update", "discharge"],
    bed: ["allocate", "transfer", "release"],
    labOrder: ["create", "read", "collect", "result"],
    medicine: ["read"],
    dispensation: ["read"],
    report: ["read"]
  },
  nurse: {
    patient: ["read", "update"],
    encounter: ["read", "update"],
    appointment: ["read", "checkIn"],
    immunization: ["create", "read", "administer", "defer"],
    growthMeasurement: ["create", "read", "update"],
    admission: ["read", "update"],
    bed: ["allocate", "transfer", "release"],
    labOrder: ["read", "collect"],
    medicine: ["read"],
    dispensation: ["read"]
  },
  pharmacist: {
    patient: ["read"],
    prescription: ["read", "dispense"],
    medicine: ["create", "read", "update", "receive", "adjust"],
    dispensation: ["create", "read"]
  },
  labTech: {
    patient: ["read"],
    labOrder: ["read", "collect", "result"]
  },
  receptionist: {
    patient: ["create", "read", "update"],
    appointment: ["create", "read", "update", "cancel", "checkIn"],
    invoice: ["create", "read", "issue"],
    payment: ["create", "read"]
  },
  accountant: {
    patient: ["read"],
    invoice: ["create", "read", "issue", "void"],
    payment: ["create", "read", "refund"],
    expense: ["create", "read", "update"],
    report: ["read", "export"],
    audit: ["read"]
  },
  patient: {
    patient: ["read"],
    appointment: ["read"],
    prescription: ["read"],
    immunization: ["read"],
    growthMeasurement: ["read"],
    labOrder: ["read"],
    invoice: ["read"],
    payment: ["read"]
  }
};

// ============================================================================
// 5. Role metadata (UI)
// ============================================================================

export const ROLE_PRIORITY: Record<UserRole, number> = {
  admin: 100,
  doctor: 80,
  nurse: 60,
  pharmacist: 60,
  labTech: 50,
  receptionist: 40,
  accountant: 50,
  patient: 10
};

export const ROLE_LABELS: Record<UserRole, { en: string; ar: string; color: string }> = {
  admin: { en: "Administrator", ar: "مدير النظام", color: "text-red-600 bg-red-50" },
  doctor: { en: "Pediatrician", ar: "طبيب أطفال", color: "text-blue-600 bg-blue-50" },
  nurse: { en: "Nurse", ar: "ممرض/ة", color: "text-teal-600 bg-teal-50" },
  pharmacist: { en: "Pharmacist", ar: "صيدلي", color: "text-purple-600 bg-purple-50" },
  labTech: { en: "Lab Technician", ar: "فني مختبر", color: "text-cyan-600 bg-cyan-50" },
  receptionist: { en: "Receptionist", ar: "موظف استقبال", color: "text-green-600 bg-green-50" },
  accountant: { en: "Accountant", ar: "محاسب", color: "text-amber-600 bg-amber-50" },
  patient: { en: "Patient / Guardian", ar: "مريض / ولي أمر", color: "text-gray-600 bg-gray-50" }
};

export const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as UserRole[]).map((value) => {
  return {
    value,
    label: ROLE_LABELS[value].en,
    labelAr: ROLE_LABELS[value].ar
  };
});

// ============================================================================
// 6. Helpers
// ============================================================================

export type Resource = keyof typeof statements;
export type Permission = `${Resource}:${string}`;

export function getRolePriority(role: UserRole): number {
  return ROLE_PRIORITY[role] ?? 0;
}

export function isHigherOrEqualRole(a: UserRole, b: UserRole): boolean {
  return getRolePriority(a) >= getRolePriority(b);
}

/**
 * Flattens a role's permission map into `resource:action` strings.
 * Reads from `rolePermissionsMap` — the static source of truth — NOT
 * from the `ac.newRole()` return value (which is a private API).
 */
export function getEffectivePermissions(role: UserRole): Permission[] {
  const map = rolePermissionsMap[role];
  if (!map) return [];

  const out: Permission[] = [];
  for (const [resource, actions] of Object.entries(map)) {
    if (!Array.isArray(actions)) continue;
    for (const action of actions) {
      out.push(`${resource}:${action}` as Permission);
    }
  }
  return out;
}

export function isValidRole(role: string): role is UserRole {
  return role in roles;
}

export function getDefaultRole(): UserRole {
  return "patient";
}

// Re-export for convenience
export { statements as statement };
