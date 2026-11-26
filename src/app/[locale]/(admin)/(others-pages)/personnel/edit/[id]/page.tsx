import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { asc } from "drizzle-orm";

import PersonEdit from "@/components/personnel/PersonEdit";

import { db } from "@/db";
import { departments, positions, positionType } from "@/db/schema";

import { getCurrentUser } from "@/lib/auth";

// ======================================================
// METADATA
// ======================================================

export const metadata: Metadata = {
  title: "แก้ไขข้อมูลบุคลากร",
  description: "ระบบแก้ไขข้อมูลบุคลากรโรงพยาบาล",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ======================================================
// TYPES
// ======================================================

type PageProps = {
  params: Promise<{
    locale: string;
    id: string;
  }>;
};

// ======================================================
// PAGE
// ======================================================

export default async function PersonEditPage({ params }: PageProps) {
  const { locale, id } = await params;

  // ----------------------------------------------------
  // 1. VALIDATE LOCALE
  // ----------------------------------------------------

  if (!["th", "en"].includes(locale)) {
    notFound();
  }

  // ----------------------------------------------------
  // 2. VALIDATE PERSON ID
  // ----------------------------------------------------

  if (!/^[1-9]\d*$/.test(id)) {
    notFound();
  }

  const personId = Number(id);

  if (!Number.isSafeInteger(personId) || personId > 2147483647) {
    notFound();
  }

  // ----------------------------------------------------
  // 3. AUTHORIZATION
  // ----------------------------------------------------

  const user = await getCurrentUser();

  if (!user || user.ac_role !== "admin") {
    notFound();
  }

  // ----------------------------------------------------
  // 4. LOAD DROPDOWN OPTIONS
  // ----------------------------------------------------

  const [departmentRows, positionRows, positionTypeRows] = await Promise.all([
    // หน่วยงาน
    db
      .select({
        id: departments.dep_id,
        name: departments.dep_name,
      })
      .from(departments)
      .orderBy(asc(departments.dep_name)),

    // ตำแหน่ง
    db
      .select({
        id: positions.ps_id,
        name: positions.ps_name,
      })
      .from(positions)
      .orderBy(asc(positions.ps_name)),

    // ประเภทตำแหน่ง
    db
      .select({
        id: positionType.ps_type_id,
        name: positionType.ps_name_type,
      })
      .from(positionType)
      .orderBy(asc(positionType.ps_name_type)),
  ]);

  // ----------------------------------------------------
  // 5. FORMAT OPTIONS
  // ----------------------------------------------------

  const departmentOptions = departmentRows.map((item) => ({
    id: item.id,
    name: item.name ?? `หน่วยงาน ${item.id}`,
  }));

  const positionOptions = positionRows.map((item) => ({
    id: item.id,
    name: item.name ?? `ตำแหน่ง ${item.id}`,
  }));

  const positionTypeOptions = positionTypeRows.map((item) => ({
    id: item.id,
    name: item.name,
  }));

  // ----------------------------------------------------
  // 6. RENDER
  // ----------------------------------------------------

  return (
    <PersonEdit
      personId={personId}
      backHref={`/${locale}/personnel`}
      departments={departmentOptions}
      positions={positionOptions}
      positionTypes={positionTypeOptions}
    />
  );
}
