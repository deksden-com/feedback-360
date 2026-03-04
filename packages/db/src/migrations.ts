import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import { createDb, createPool } from "./db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const migrationsFolder = path.resolve(__dirname, "../drizzle");
const journalFile = path.join(migrationsFolder, "meta", "_journal.json");

const hasDrizzleJournal = async (): Promise<boolean> => {
  try {
    await access(journalFile);
    return true;
  } catch {
    return false;
  }
};

const applySqlMigrationsFallback = async (db: ReturnType<typeof createDb>): Promise<void> => {
  const files = await readdir(migrationsFolder);
  const sqlFiles = files.filter((file) => file.endsWith(".sql")).sort();

  for (const file of sqlFiles) {
    const fullPath = path.join(migrationsFolder, file);
    const content = await readFile(fullPath, "utf8");
    await db.execute(sql.raw(content));
  }
};

export const applyMigrations = async (): Promise<void> => {
  const pool = createPool();

  try {
    const db = createDb(pool);

    if (await hasDrizzleJournal()) {
      await migrate(db, { migrationsFolder });
      return;
    }

    await applySqlMigrationsFallback(db);
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
