import { int, mysqlTable, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

// ======================================================
// TABLE: tbl_department
// ======================================================

export const departments = mysqlTable(
  "tbl_department",
  {
    // รหัสแผนก
    dep_id: int("dep_id").primaryKey().autoincrement(),

    // ชื่อแผนก (ห้ามซ้ำ)
    dep_name: varchar("dep_name", {
      length: 255,
    }).notNull(),

    // เบอร์โทรศัพท์แผนก
    dep_phone: varchar("dep_phone", {
      length: 20,
    }),
  },
  (table) => [uniqueIndex("uq_tbl_department_dep_name").on(table.dep_name)],
);

// ======================================================
// TYPES
// ======================================================

export type Department = typeof departments.$inferSelect;

export type NewDepartment = typeof departments.$inferInsert;
