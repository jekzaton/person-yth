import type { Metadata } from "next";
import CarBrand from "@/components/car/carBrand/CarBrand";

export const metadata: Metadata = {
  title: "จัดการยี่ห้อรถยนต์ | Person YTH",
  description:
    "ระบบจัดการข้อมูลยี่ห้อรถยนต์ เพิ่ม แก้ไข ลบ และค้นหายี่ห้อรถยนต์",
};

export default function CarBrandPage() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <CarBrand />
    </div>
  );
}
