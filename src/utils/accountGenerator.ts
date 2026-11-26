export function generatePersonnelUsername(
  acId: number,
  psId: number | null,
): string {
  if (!Number.isSafeInteger(acId) || acId <= 0) {
    throw new Error("รหัสบุคลากรไม่ถูกต้อง");
  }

  if (psId !== null && (!Number.isSafeInteger(psId) || psId <= 0)) {
    throw new Error("รหัสตำแหน่งไม่ถูกต้อง");
  }

  const personnelId = String(acId).padStart(3, "0");
  const positionId = String(psId ?? 0).padStart(3, "0");

  return `u${personnelId}${positionId}`;
}
