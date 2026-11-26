import { asc } from "drizzle-orm";

import { db } from "@/db";
import { departments, positions, positionType } from "@/db/schema";

import PersonCreate from "@/components/personnel/PersonCreate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PersonCreatePage() {
  // ตรวจสอบสิทธิ์ Admin ด้วย Server-side Auth
  // ก่อนอ่านข้อมูลและแสดงฟอร์ม

  const [departmentRows, positionRows, positionTypeRows] = await Promise.all([
    db
      .select({
        id: departments.dep_id,
        name: departments.dep_name,
      })
      .from(departments)
      .orderBy(asc(departments.dep_name)),

    db
      .select({
        id: positions.ps_id,
        name: positions.ps_name,
      })
      .from(positions)
      .orderBy(asc(positions.ps_name)),

    db
      .select({
        id: positionType.ps_type_id,
        name: positionType.ps_name_type,
      })
      .from(positionType)
      .orderBy(asc(positionType.ps_name_type)),
  ]);

  return (
    <PersonCreate
      departments={departmentRows.map((item) => ({
        id: item.id,
        name: item.name ?? `หน่วยงาน ${item.id}`,
      }))}
      positions={positionRows.map((item) => ({
        id: item.id,
        name: item.name ?? `ตำแหน่ง ${item.id}`,
      }))}
      positionTypes={positionTypeRows.map((item) => ({
        id: item.id,
        name: item.name,
      }))}
    />
  );
}
