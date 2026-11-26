import type { Metadata } from "next";

import Cars from "@/components/car/Cars";

export const metadata: Metadata = {
  title: "ลงทะเบียนรถ",
  description:
    "ระบบจัดการข้อมูลประเภทรถยนต์ เพิ่ม แก้ไข ลบ และค้นหาประเภทรถยนต์",
};

export default function CarPage() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <Cars />
    </div>
  );
}
