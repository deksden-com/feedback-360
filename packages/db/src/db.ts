import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolClient } from "pg";

import { getDatabaseUrl } from "./connection-string";
import * as schema from "./schema";

export type DbSessionContext = {
  serviceRole?: boolean;
  userId?: string;
};

const buildPgOptions = (context: DbSessionContext): string => {
  const isServiceRole = context.serviceRole ?? true;
  const options = [`-c app.is_service_role=${isServiceRole ? "on" : "off"}`];

  if (context.userId) {
    options.push(`-c app.current_user_id=${context.userId}`);
  }

  return options.join(" ");
};

export const createPool = (context: DbSessionContext = {}): Pool => {
  return new Pool({
    connectionString: getDatabaseUrl(),
    options: buildPgOptions(context),
  });
};

export const createDb = (client: Pool | PoolClient) => {
  return drizzle(client, { schema });
};
