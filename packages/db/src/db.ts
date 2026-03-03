import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

const getDatabaseUrl = (): string => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Export DATABASE_URL before running DB commands.");
  }

  return databaseUrl;
};

export const createPool = (): Pool => {
  return new Pool({ connectionString: getDatabaseUrl() });
};

export const createDb = (pool: Pool) => {
  return drizzle(pool, { schema });
};
