import type { Metadata } from "next";
import PositionTypeList from "@/components/personnel/positionTypeC/PositionTypeList";

export const metadata: Metadata = {
  title: "Position Type YTH",
  description: "ระบบจัดการประเภทตำแหน่งบุคลากร โรงพยาบาลยางตลาด",
};

export default function page() {
  return <PositionTypeList />;
}
