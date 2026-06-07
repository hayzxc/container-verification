export const USER_ROLES = ["ADMIN", "INSPECTOR", "AUDITOR"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const INSPECTION_STATUSES = [
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CLARIFICATION"
] as const;

export const REQUIRED_PHOTO_ANGLES = ["FRONT", "BACK", "LEFT", "RIGHT"] as const;
