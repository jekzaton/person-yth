import type { Metadata } from "next";
import DepartmentList from "@/components/personnel/departmentC/DepartmentList";

export const metadata: Metadata = {
  title: "Department YTH",
  description: "แผนก โรงพยาบาลยางตลาด",
};

export default function page() {
  return <DepartmentList />;
}
