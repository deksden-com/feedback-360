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

export const getDatabaseUrl = (): string => {
  const rawValue = process.env.SUPABASE_DB_POOLER_URL ?? process.env.DATABASE_URL;

  if (!rawValue) {
    throw new Error(
      "Database URL is not set. Export DATABASE_URL or SUPABASE_DB_POOLER_URL (preferred for Supabase cloud).",
    );
  }

  return normalizeSupabasePoolerConnectionString(rawValue);
};

export const hasDatabaseUrl = (): boolean => {
  return Boolean(process.env.SUPABASE_DB_POOLER_URL ?? process.env.DATABASE_URL);
};
