import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { Command } from "commander";

import {
  type OperationError,
  type OperationResult,
  type QuestionnaireStatus,
  type SeedScenario,
  createOperationError,
  errorFromUnknown,
} from "@feedback-360/api-contract";
import { createInprocClient } from "@feedback-360/client";

type SeedCommandOptions = {
  json?: boolean;
  scenario: string;
  variant?: string;
};

type JsonFlagOptions = {
  json?: boolean;
};

type QuestionnaireListOptions = {
  json?: boolean;
  campaign: string;
  status?: QuestionnaireStatus;
};

type QuestionnaireSaveDraftOptions = {
  json?: boolean;
  draftJson?: string;
};

type CliState = {
  activeCompanyId?: string;
};

const cliStateFilePath = join(homedir(), ".feedback360", "cli-state.json");

const loadCliState = async (): Promise<CliState> => {
  try {
    const rawState = await readFile(cliStateFilePath, "utf8");
    const parsedState = JSON.parse(rawState) as { activeCompanyId?: unknown };
    if (typeof parsedState.activeCompanyId === "string") {
      return { activeCompanyId: parsedState.activeCompanyId };
    }

    return {};
  } catch {
    return {};
  }
};

const saveCliState = async (state: CliState): Promise<void> => {
  const directory = join(homedir(), ".feedback360");
  await mkdir(directory, { recursive: true });
  await writeFile(cliStateFilePath, JSON.stringify(state, null, 2), "utf8");
};

const emitError = (error: OperationError, asJson?: boolean): void => {
  if (asJson) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          error,
        },
        null,
        2,
      ),
    );
  } else {
    console.error(`${error.code}: ${error.message}`);
  }

  process.exitCode = 1;
};

const emitResult = <Output>(result: OperationResult<Output>, asJson?: boolean): boolean => {
  if (!result.ok) {
    emitError(result.error, asJson);
    return false;
  }

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          data: result.data,
        },
        null,
        2,
      ),
    );
    return true;
  }

  return true;
};

const getClientWithActiveCompany = async (asJson?: boolean) => {
  const state = await loadCliState();
  const client = createInprocClient();

  if (!state.activeCompanyId) {
    emitError(
      createOperationError(
        "forbidden",
        "Active company is not set. Run `company use <company_id>` first.",
      ),
      asJson,
    );
    return null;
  }

  const setResult = client.setActiveCompany(state.activeCompanyId);
  if (!setResult.ok) {
    emitError(setResult.error, asJson);
    return null;
  }

  return client;
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

const formatQuestionnaireListHuman = (data: {
  items: Array<{
    questionnaireId: string;
    status: string;
    subjectEmployeeId: string;
    raterEmployeeId: string;
    submittedAt?: string;
  }>;
}): string => {
  if (data.items.length === 0) {
    return "No questionnaires found.";
  }

  const lines = [`Questionnaires: ${data.items.length}`];
  for (const item of data.items) {
    lines.push(
      `- ${item.questionnaireId}: status=${item.status}, subject=${item.subjectEmployeeId}, rater=${item.raterEmployeeId}${item.submittedAt ? `, submittedAt=${item.submittedAt}` : ""}`,
    );
  }

  return lines.join("\n");
};

const normalizeLegacySeedArgs = (argv: string[]): string[] => {
  const normalizedArgv = [...argv];
  if (normalizedArgv[2] === "--") {
    normalizedArgv.splice(2, 1);
  }

  const firstArgument = normalizedArgv[2];
  if (!firstArgument) {
    return normalizedArgv;
  }

  const knownTopLevelCommands = new Set(["seed", "company", "questionnaire"]);
  if (!knownTopLevelCommands.has(firstArgument) && firstArgument.startsWith("--")) {
    normalizedArgv.splice(2, 0, "seed");
  }

  return normalizedArgv;
};

export const runCli = async (argv: string[]): Promise<void> => {
  const normalizedArgv = normalizeLegacySeedArgs(argv);
  const program = new Command();

  program
    .name("feedback360")
    .description("feedback-360 CLI (human-readable output + --json).")
    .addHelpText(
      "after",
      `
Examples:
  pnpm seed --scenario S1_company_min
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- company use <company_id>
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- questionnaire list --campaign <campaign_id> --json
`,
    );

  program
    .command("seed")
    .description("Run deterministic database seed scenarios.")
    .requiredOption(
      "--scenario <scenario>",
      "Seed scenario name (S0_empty | S1_company_min | S2_org_basic | S5_campaign_started_no_answers).",
    )
    .option("--variant <variant>", "Optional seed variant (currently not supported).")
    .option("--json", "Output machine-readable JSON.")
    .action(async (options: SeedCommandOptions) => {
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
        emitError(errorFromUnknown(error, "invalid_input", "seed.run failed."), options.json);
      }
    });

  const companyCommand = program.command("company").description("Company context operations.");

  companyCommand
    .command("use")
    .description("Set active company in local CLI state.")
    .argument("<company_id>", "Company identifier.")
    .option("--json", "Output machine-readable JSON.")
    .action(async (companyId: string, options: JsonFlagOptions) => {
      try {
        const client = createInprocClient();
        const result = client.setActiveCompany(companyId);

        if (!emitResult(result, options.json)) {
          return;
        }

        await saveCliState({ activeCompanyId: companyId });
        if (!options.json) {
          console.log(`Active company: ${companyId}`);
        }
      } catch (error: unknown) {
        emitError(
          errorFromUnknown(error, "invalid_input", "Failed to set active company."),
          options.json,
        );
      }
    });

  const questionnaireCommand = program
    .command("questionnaire")
    .description("Questionnaire operations.");

  questionnaireCommand
    .command("list")
    .description("List assigned questionnaires by campaign/status.")
    .requiredOption("--campaign <campaign_id>", "Campaign identifier.")
    .option("--status <status>", "Status filter (not_started | in_progress | submitted).")
    .option("--json", "Output machine-readable JSON.")
    .action(async (options: QuestionnaireListOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      const result = await client.questionnaireListAssigned({
        campaignId: options.campaign,
        status: options.status,
      });

      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(formatQuestionnaireListHuman(result.data));
      }
    });

  questionnaireCommand
    .command("save-draft")
    .description("Save questionnaire draft and trigger campaign lock (if first draft).")
    .argument("<questionnaire_id>", "Questionnaire identifier.")
    .option("--draft-json <json>", "Draft payload JSON string.", "{}")
    .option("--json", "Output machine-readable JSON.")
    .action(async (questionnaireId: string, options: QuestionnaireSaveDraftOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      let draftPayload: Record<string, unknown>;
      try {
        const parsed = JSON.parse(options.draftJson ?? "{}");
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          throw new Error("draft-json must be a JSON object.");
        }
        draftPayload = parsed as Record<string, unknown>;
      } catch (error: unknown) {
        emitError(
          errorFromUnknown(error, "invalid_input", "Invalid --draft-json payload."),
          options.json,
        );
        return;
      }

      const result = await client.questionnaireSaveDraft({
        questionnaireId,
        draft: draftPayload,
      });

      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(
          `Draft saved: questionnaire=${result.data.questionnaireId}, status=${result.data.status}, campaignLockedAt=${result.data.campaignLockedAt}`,
        );
      }
    });

  questionnaireCommand
    .command("submit")
    .description("Submit questionnaire.")
    .argument("<questionnaire_id>", "Questionnaire identifier.")
    .option("--json", "Output machine-readable JSON.")
    .action(async (questionnaireId: string, options: JsonFlagOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      const result = await client.questionnaireSubmit({ questionnaireId });
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(
          `Submitted: questionnaire=${result.data.questionnaireId}, submittedAt=${result.data.submittedAt}${result.data.wasAlreadySubmitted ? " (already submitted)" : ""}`,
        );
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
