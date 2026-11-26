import { int, mysqlTable, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const positions = mysqlTable(
  "tbl_position",
  {
    ps_id: int("ps_id").primaryKey().autoincrement(),

    ps_name: varchar("ps_name", {
      length: 255,
    }).notNull(),
  },
  (table) => [uniqueIndex("uq_tbl_position_ps_name").on(table.ps_name)],
);

export type Position = typeof positions.$inferSelect;

export type NewPosition = typeof positions.$inferInsert;
