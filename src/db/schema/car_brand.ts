import { int, mysqlTable, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const car_brands = mysqlTable(
  "car_brand",
  {
    c_brand_id: int("c_brand_id").primaryKey().autoincrement(),

    c_brand_name: varchar("c_brand_name", {
      length: 255,
    }).notNull(),
  },
  (table) => [uniqueIndex("uq_car_brand_name").on(table.c_brand_name)],
);
