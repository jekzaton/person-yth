import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const requiredEnv = ["DB_HOST", "DB_USER", "DB_NAME"] as const;

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}

const port = Number(process.env.DB_PORT || 3306);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("Invalid DB_PORT");
}

export default defineConfig({
  schema: "./src/db/schema/*.ts",
  out: "./drizzle",
  dialect: "mysql",

  dbCredentials: {
    host: process.env.DB_HOST!,
    port,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME!,
  },

  verbose: true,
  strict: true,
});
