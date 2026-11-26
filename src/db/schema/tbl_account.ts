import {
  mysqlTable,
  int,
  varchar,
  text,
  date,
  tinyint,
  timestamp,
  index,
  uniqueIndex,
  mysqlEnum,
} from "drizzle-orm/mysql-core";

export const tblAccount = mysqlTable(
  "tbl_account",
  {
    // Primary Key
    ac_id: int("ac_id").autoincrement().primaryKey(),

    // Authentication
    ac_cid: varchar("ac_cid", { length: 13 }).notNull(),

    ac_password: varchar("ac_password", { length: 255 }),

    ac_username: varchar("ac_username", { length: 100 }),

    // Hospital Number
    ac_hn: varchar("ac_hn", { length: 20 }),

    // Thai Name
    ac_pname: varchar("ac_pname", { length: 50 }),

    ac_fname: varchar("ac_fname", { length: 150 }),

    ac_lname: varchar("ac_lname", { length: 150 }),
    ac_nickname: varchar("ac_nickname", { length: 150 }),

    // English Name
    ac_pname_eng: varchar("ac_pname_eng", { length: 50 }),

    ac_fname_eng: varchar("ac_fname_eng", { length: 150 }),

    ac_lname_eng: varchar("ac_lname_eng", { length: 150 }),

    // Contact
    ac_email: varchar("ac_email", { length: 255 }),

    ac_phone_number: varchar("ac_phone_number", {
      length: 20,
    }),

    ac_address: text("ac_address"),

    ac_birthday: date("ac_birthday", {
      mode: "string",
    }),

    // Department / Position
    dep_id: int("dep_id"),

    ps_id: int("ps_id"),

    ps_type_id: int("ps_type_id"),

    // Professional Certificate
    ac_certificate_number: varchar("ac_certificate_number", { length: 100 }),

    // Profile
    img_profile: varchar("img_profile", {
      length: 500,
    }),

    rfid: varchar("rfid", { length: 100 }),

    // Authorization
    level: int("level").notNull().default(1),

    // Account Status
    ac_active: tinyint("ac_active").notNull().default(1),

    ac_role: mysqlEnum("ac_role", ["admin", "member", "user"])
      .notNull()
      .default("user"),

    // Timestamps
    createdAt: timestamp("createdAt").defaultNow().notNull(),

    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_account_cid").on(table.ac_cid),

    uniqueIndex("uq_account_username").on(table.ac_username),

    index("idx_account_hn").on(table.ac_hn),

    index("idx_account_department").on(table.dep_id),

    index("idx_account_position").on(table.ps_id),

    index("idx_account_active").on(table.ac_active),
    index("idx_account_role").on(table.ac_role),
  ],
);

// Types
export type Account = typeof tblAccount.$inferSelect;

export type NewAccount = typeof tblAccount.$inferInsert;

export type AccountRole = Account["ac_role"];
