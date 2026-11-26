import z from "zod";

export const carTypeSchema = z.strictObject({
  car_type_name: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อประเภทรถ")
    .max(255, "ชื่อประเภทรถต้องไม่เกิน 255 ตัวอักษร")
    .transform((value) => value.replace(/\s+/g, " ")),
});

const carTypeEditSchema = z.strictObject({
  car_type_name: z
    .string()
    .trim()
    .transform((value) => value.replace(/\s+/g, " "))
    .pipe(
      z
        .string()
        .min(1, "กรุณากรอกประเภทรถ")
        .max(255, "ชื่อประเภทรถต้องไม่เกิน 255 ตัวอักษร"),
    ),
});
