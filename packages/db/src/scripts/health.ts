import { runHealthCheck } from "../migrations";

const main = async (): Promise<void> => {
  try {
    await runHealthCheck();
    console.log("DB health-check passed.");
  } catch (error: unknown) {
    console.error("DB health-check failed.");
    console.error(error);
    process.exitCode = 1;
  }
};

void main();
