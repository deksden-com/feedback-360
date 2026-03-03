import { applyMigrations } from "../migrations";

const main = async (): Promise<void> => {
  try {
    await applyMigrations();
    console.log("Migrations applied successfully.");
  } catch (error: unknown) {
    console.error("Failed to apply migrations.");
    console.error(error);
    process.exitCode = 1;
  }
};

void main();
