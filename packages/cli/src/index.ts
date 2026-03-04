import { pathToFileURL } from "node:url";
import { Command } from "commander";

import type { SeedScenario } from "@feedback-360/api-contract";
import { createInprocClient } from "@feedback-360/client";

type SeedCommandOptions = {
  json?: boolean;
  scenario: string;
  variant?: string;
};

const formatSeedHuman = (result: { scenario: string; handles: Record<string, string> }): string => {
  const entries = Object.entries(result.handles).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  const lines = [`Scenario: ${result.scenario}`];

  if (entries.length === 0) {
    lines.push("Handles: (none)");
    return lines.join("\n");
  }

  lines.push("Handles:");
  for (const [key, value] of entries) {
    lines.push(`  - ${key} = ${value}`);
  }

  return lines.join("\n");
};

export const runCli = async (argv: string[]): Promise<void> => {
  const normalizedArgv = [...argv];
  if (normalizedArgv[2] === "--") {
    normalizedArgv.splice(2, 1);
  }

  const program = new Command();

  program
    .name("seed")
    .description("Run deterministic database seed scenarios.")
    .requiredOption(
      "--scenario <scenario>",
      "Seed scenario name (S0_empty | S1_company_min | S2_org_basic).",
    )
    .option("--variant <variant>", "Optional seed variant (currently not supported).")
    .option("--json", "Output machine-readable JSON.")
    .addHelpText(
      "after",
      `
Examples:
  pnpm seed --scenario S1_company_min
  pnpm seed --scenario S2_org_basic --json
`,
    );

  program.action(async (options: SeedCommandOptions) => {
    try {
      const client = createInprocClient();
      const result = await client.seedRun({
        scenario: options.scenario as SeedScenario,
        variant: options.variant,
      });

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      console.log(formatSeedHuman(result));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      if (options.json) {
        console.log(
          JSON.stringify(
            {
              error: {
                code: "SEED_RUN_FAILED",
                message,
              },
            },
            null,
            2,
          ),
        );
      } else {
        console.error(`seed failed: ${message}`);
      }

      process.exitCode = 1;
    }
  });

  await program.parseAsync(normalizedArgv);
};

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isDirectRun) {
  void runCli(process.argv);
}

export const cliReady = true;
