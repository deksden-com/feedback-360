import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { config as loadDotenv } from "dotenv";

const supabasePoolerHostSuffix = ".pooler.supabase.com";

const isSupabasePoolerHost = (hostname: string): boolean => {
  return hostname.endsWith(supabasePoolerHostSuffix);
};

const normalizeSupabasePoolerConnectionString = (value: string): string => {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    return value;
  }

  if (!isSupabasePoolerHost(parsedUrl.hostname)) {
    return value;
  }

  if (!parsedUrl.searchParams.has("sslmode")) {
    parsedUrl.searchParams.set("sslmode", "require");
  }

  if (!parsedUrl.searchParams.has("uselibpqcompat")) {
    parsedUrl.searchParams.set("uselibpqcompat", "true");
  }

  return parsedUrl.toString();
};

const loadEnvIfNeeded = (): void => {
  if (process.env.SUPABASE_DB_POOLER_URL || process.env.DATABASE_URL) {
    return;
  }

  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [resolve(process.cwd(), ".env"), resolve(moduleDir, "../../../.env")];

  for (const path of candidates) {
    if (!existsSync(path)) {
      continue;
    }
    loadDotenv({ path, override: false });
    if (process.env.SUPABASE_DB_POOLER_URL || process.env.DATABASE_URL) {
      return;
    }
  }
};

loadEnvIfNeeded();

const isDatabaseTestRunDisabled = (): boolean => {
  return process.env.FEEDBACK360_SKIP_DB_TESTS === "1";
};

export const getDatabaseUrl = (): string => {
  const rawValue = process.env.SUPABASE_DB_POOLER_URL ?? process.env.DATABASE_URL;

  if (!rawValue) {
    throw new Error(
      "Database URL is not set. Export DATABASE_URL or SUPABASE_DB_POOLER_URL (preferred for Supabase cloud).",
    );
  }

  return normalizeSupabasePoolerConnectionString(rawValue);
};

export const isSupabasePoolerDatabaseUrl = (): boolean => {
  const rawValue = process.env.SUPABASE_DB_POOLER_URL ?? process.env.DATABASE_URL;

  if (!rawValue) {
    return false;
  }

  try {
    return isSupabasePoolerHost(new URL(rawValue).hostname);
  } catch {
    return false;
  }
};

export const hasDatabaseUrl = (): boolean => {
  if (isDatabaseTestRunDisabled()) {
    return false;
  }

  return Boolean(process.env.SUPABASE_DB_POOLER_URL ?? process.env.DATABASE_URL);
};
