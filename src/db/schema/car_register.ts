import {
  int,
  mysqlTable,
  varchar,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

import { car_brands } from "./car_brand";

export const car_register = mysqlTable(
  "car_register",
  {
    // Primary Key
    car_id: int("car_id").primaryKey().autoincrement(),

    // ทะเบียนรถยนต์
    car_license: varchar("car_license", {
      length: 150,
    }).notNull(),

    // จังหวัดที่จดทะเบียน
    car_province: varchar("car_province", {
      length: 255,
    }).notNull(),

    // ยี่ห้อรถยนต์
    c_brand_id: int("c_brand_id")
      .notNull()
      .references(() => car_brands.c_brand_id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    // รุ่นรถยนต์
    car_model: varchar("car_model", {
      length: 255,
    }).notNull(),

    // สีรถยนต์
    car_color: varchar("car_color", {
      length: 255,
    }).notNull(),

    // ประเภทรถยนต์
    car_type_id: int("car_type_id").notNull(),

    // สถานะการพิมพ์
    car_print_status: int("car_print_status").notNull().default(0),

    // ผู้บันทึกข้อมูล
    ac_id: int("ac_id").notNull(),
  },
  (table) => [
    // ไม่ให้ทะเบียนเดียวกันซ้ำภายในจังหวัด
    uniqueIndex("uq_car_license_province").on(
      table.car_license,
      table.car_province,
    ),

    index("idx_car_brand").on(table.c_brand_id),

    index("idx_car_type").on(table.car_type_id),

    index("idx_car_account").on(table.ac_id),
  ],
);

export type CarRegister = typeof car_register.$inferSelect;

export type NewCarRegister = typeof car_register.$inferInsert;
