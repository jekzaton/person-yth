import type { Metadata } from "next";
import PositionList from "@/components/personnel/positionC/PositionList";

export const metadata: Metadata = {
  title: "Position YTH",
  description: "ระบบจัดการตำแหน่งบุคลากร โรงพยาบาลยางตลาด",
};

export default function page() {
  return <PositionList />;
}
