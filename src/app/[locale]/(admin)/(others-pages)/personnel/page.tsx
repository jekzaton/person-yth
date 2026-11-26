import type { Metadata } from "next";

import PersonList from "@/components/personnel/PersonList";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Personnel YTH",
  description: "ระบบบริหารจัดการข้อมูลบุคลากรโรงพยาบาลยางตลาด",
};

export default async function PersonnelPage() {
  const user = await getCurrentUser();

  // ตรวจสอบสิทธิ์จากฐานข้อมูลจริง
  const canManage = user?.ac_role === "admin";

  return <PersonList canManage={canManage} />;
}
