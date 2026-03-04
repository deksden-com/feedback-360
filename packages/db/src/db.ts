import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { getDatabaseUrl } from "./connection-string";
import * as schema from "./schema";

export const createPool = (): Pool => {
  return new Pool({ connectionString: getDatabaseUrl() });
};

export const createDb = (pool: Pool) => {
  return drizzle(pool, { schema });
};
