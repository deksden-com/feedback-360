import "dotenv/config";

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.SUPABASE_DB_POOLER_URL ??
      process.env.DATABASE_URL ??
      "postgres://postgres:postgres@localhost:5432/feedback360",
  },
});
