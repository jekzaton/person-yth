import { int, mysqlTable, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const car_type = mysqlTable(
  "car_type",
  {
    car_type_id: int("car_type_id").primaryKey().autoincrement(),

    car_type_name: varchar("car_type_name", {
      length: 255,
    }).notNull(),
  },
  (table) => [uniqueIndex("uq_car_type_name").on(table.car_type_name)],
);
