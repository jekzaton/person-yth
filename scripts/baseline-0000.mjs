
import "dotenv/config";

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import mysql from "mysql2/promise";

const EXPECTED_DATABASE = "person_yth_db";

const BASELINE_TAG = "0000_robust_luminals";
const NEW_MIGRATION_TAG = "0001_add_position_type";

const journal = JSON.parse(
  readFileSync("./drizzle/meta/_journal.json", "utf8"),
);

const baseline = journal.entries.find(
  (entry) => entry.tag === BASELINE_TAG,
);

const nextMigration = journal.entries.find(
  (entry) => entry.tag === NEW_MIGRATION_TAG,
);

if (!baseline || !nextMigration) {
  throw new Error("ไม่พบ Migration 0000 หรือ 0001 ใน Journal");
}

if (baseline.when >= nextMigration.when) {
  throw new Error("ลำดับ Migration ไม่ถูกต้อง");
}

const migrationSql = readFileSync(
  `./drizzle/${BASELINE_TAG}.sql`,
  "utf8",
);

const hash = createHash("sha256")
  .update(migrationSql)
  .digest("hex");

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME,
});

try {
  const [[database]] = await connection.query(
    "SELECT DATABASE() AS name",
  );

  if (database.name !== EXPECTED_DATABASE) {
    throw new Error(
      `ฐานข้อมูลไม่ถูกต้อง: ${database.name}`,
    );
  }

  // ตรวจสอบว่าตารางเก่ามีครบก่อนทำ Baseline
  const expected = {
    tbl_account: [
      "ac_id",
      "ac_cid",
      "ac_role",
      "ac_active",
      "ps_type_id",
    ],
    tbl_position: ["ps_id", "ps_name"],
    tbl_department: [
      "dep_id",
      "dep_name",
      "dep_phone",
    ],
  };

  for (const [table, requiredColumns] of Object.entries(expected)) {
    const [columns] = await connection.query(
      `SHOW COLUMNS FROM \`${table}\``,
    );

    const actual = new Set(
      columns.map((column) => column.Field),
    );

    for (const column of requiredColumns) {
      if (!actual.has(column)) {
        throw new Error(
          `ตาราง ${table} ไม่มีคอลัมน์ ${column}`,
        );
      }
    }
  }

  // ห้ามทำ Baseline หากมีตารางใหม่แล้ว
  const [newTable] = await connection.query(
    `
    SELECT TABLE_NAME
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'position_type'
    `,
  );

  if (newTable.length > 0) {
    throw new Error(
      "พบตาราง position_type อยู่แล้ว ต้องตรวจ Migration ก่อน",
    );
  }

  const [history] = await connection.query(
    `
    SELECT id, hash, created_at
    FROM __drizzle_migrations
    ORDER BY created_at
    `,
  );

  console.log("Migration history:", history);

  // ป้องกันการทำ Baseline ซ้ำ
  if (
    history.some(
      (row) => Number(row.created_at) === baseline.when,
    )
  ) {
    throw new Error(
      "Migration 0000 ถูกบันทึกไว้แล้ว ไม่ต้อง Baseline ซ้ำ",
    );
  }

  // ไม่แก้ประวัติที่ใหม่กว่า Baseline
  if (
    history.some(
      (row) => Number(row.created_at) > baseline.when,
    )
  ) {
    throw new Error(
      "มี Migration ใหม่กว่า 0000 ในฐานข้อมูล ต้องตรวจสอบก่อน",
    );
  }

  console.log("Database:", database.name);
  console.log("Baseline:", BASELINE_TAG);
  console.log("Timestamp:", baseline.when);
  console.log("SHA256:", hash);

  // เพิ่มเฉพาะประวัติ Migration 0000
  // ไม่สร้าง ไม่ลบ และไม่แก้ตารางบุคลากร
  await connection.execute(
    `
    INSERT INTO __drizzle_migrations
      (hash, created_at)
    VALUES (?, ?)
    `,
    [hash, String(baseline.when)],
  );

  console.log("✅ Baseline 0000 สำเร็จ");
  console.log("✅ พร้อมรัน drizzle-kit migrate สำหรับ 0001");
} finally {
  await connection.end();
}
