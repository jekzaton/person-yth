export const ACCOUNT_ROLE_OPTIONS = [
  {
    value: "user",
    label: "ผู้ใช้งานทั่วไป",
    description: "ใช้งานระบบตามสิทธิ์ที่ได้รับ",
  },
  {
    value: "member",
    label: "สมาชิก",
    description: "สำหรับผู้ใช้งานที่ได้รับสิทธิ์สมาชิก",
  },
  {
    value: "admin",
    label: "ผู้ดูแลระบบ",
    description: "จัดการข้อมูลและสิทธิ์ภายในระบบ",
  },
] as const;

export type AccountRole = (typeof ACCOUNT_ROLE_OPTIONS)[number]["value"];

export function getAccountRoleLabel(role: string | null | undefined): string {
  return (
    ACCOUNT_ROLE_OPTIONS.find((item) => item.value === role)?.label ??
    "ไม่ระบุบทบาท"
  );
}
