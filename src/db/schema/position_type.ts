import { int, mysqlTable, varchar } from "drizzle-orm/mysql-core";

export const positionType = mysqlTable("position_type", {
  ps_type_id: int("ps_type_id").primaryKey().autoincrement(),

  ps_name_type: varchar("ps_name_type", {
    length: 255,
  }).notNull(),
});

export type PositionType = typeof positionType.$inferSelect;

export type NewPositionType = typeof positionType.$inferInsert;
