import type { Metadata } from "next";

import CarType from "@/components/car/carType/CarType";

export const metadata: Metadata = {
  title: "จัดการประเภทรถ",
  description:
    "ระบบจัดการข้อมูลประเภทรถยนต์ เพิ่ม แก้ไข ลบ และค้นหาประเภทรถยนต์",
};

export default function CarTypePage() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <CarType />
    </div>
  );
}
