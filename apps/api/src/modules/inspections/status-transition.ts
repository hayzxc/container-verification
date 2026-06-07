import type { InspectionStatus, UserRole } from "@prisma/client";

export function canTransitionInspectionStatus(input: {
  actorRole: UserRole;
  currentStatus: InspectionStatus;
  nextStatus: InspectionStatus;
}) {
  if (
    input.actorRole === "INSPECTOR" &&
    ["DRAFT", "CLARIFICATION"].includes(input.currentStatus) &&
    input.nextStatus === "PENDING"
  ) {
    return true;
  }

  if (
    input.actorRole === "ADMIN" &&
    input.currentStatus === "PENDING" &&
    ["APPROVED", "REJECTED", "CLARIFICATION"].includes(input.nextStatus)
  ) {
    return true;
  }

  return false;
}
