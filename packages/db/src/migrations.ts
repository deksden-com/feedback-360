import path from "node:path";
import { fileURLToPath } from "node:url";

import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import { createDb, createPool } from "./db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const migrationsFolder = path.resolve(__dirname, "../drizzle");

export const applyMigrations = async (): Promise<void> => {
  const pool = createPool();

  try {
    const db = createDb(pool);
    await migrate(db, { migrationsFolder });
  } finally {
    await pool.end();
  }
};

export const runHealthCheck = async (): Promise<void> => {
  const pool = createPool();

  try {
    const db = createDb(pool);
    const result = await db.execute(sql`select 1 as ok`);

    if (result.rows.length !== 1) {
      throw new Error("Unexpected health-check response shape.");
    }
  } finally {
    await pool.end();
  }
};
