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

type CampaignSnapshotListOptions = {
  json?: boolean;
  campaign: string;
};

type CampaignParticipantsAddDepartmentsOptions = {
  json?: boolean;
  fromDepartments: string[];
  includeSelf?: string;
};

type MatrixGenerateOptions = {
  json?: boolean;
  fromDepartments?: string[];
};

type EmployeeUpsertOptions = {
  json?: boolean;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive?: string;
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

const formatEmployeeListHuman = (data: {
  items: Array<{
    employeeId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    isActive: boolean;
  }>;
}): string => {
  if (data.items.length === 0) {
    return "No active employees found.";
  }

  const lines = [`Active employees: ${data.items.length}`];
  for (const item of data.items) {
    lines.push(
      `- ${item.employeeId}: email=${item.email}, name=${item.firstName ?? ""} ${item.lastName ?? ""}, isActive=${item.isActive}`,
    );
  }

  return lines.join("\n");
};

const formatCampaignSnapshotsHuman = (data: {
  items: Array<{
    employeeId: string;
    email: string;
    departmentId?: string;
    managerEmployeeId?: string;
    snapshotAt: string;
  }>;
}): string => {
  if (data.items.length === 0) {
    return "No campaign snapshots found.";
  }

  const lines = [`Campaign snapshots: ${data.items.length}`];
  for (const item of data.items) {
    lines.push(
      `- employee=${item.employeeId}, email=${item.email}, department=${item.departmentId ?? "-"}, manager=${item.managerEmployeeId ?? "-"}, snapshotAt=${item.snapshotAt}`,
    );
  }

  return lines.join("\n");
};

const formatMatrixSuggestionsHuman = (data: {
  generatedAssignments: Array<{
    subjectEmployeeId: string;
    raterEmployeeId: string;
    raterRole: string;
  }>;
  totalAssignments: number;
}): string => {
  if (data.generatedAssignments.length === 0) {
    return "No suggested assignments generated.";
  }

  const lines = [`Suggested assignments: ${data.totalAssignments}`];
  for (const item of data.generatedAssignments) {
    lines.push(
      `- subject=${item.subjectEmployeeId}, rater=${item.raterEmployeeId}, role=${item.raterRole}`,
    );
  }

  return lines.join("\n");
};

const parseBooleanOption = (value: string, fieldName: string): boolean => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") {
    return true;
  }
  if (normalized === "false") {
    return false;
  }

  throw new Error(`${fieldName} must be either true or false.`);
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

  const knownTopLevelCommands = new Set([
    "seed",
    "company",
    "employee",
    "org",
    "campaign",
    "matrix",
    "questionnaire",
  ]);
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
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- campaign snapshot list --campaign <campaign_id> --json
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- campaign participants add-departments <campaign_id> --from-departments <department_id>...
  pnpm --filter @feedback-360/cli exec tsx src/index.ts -- questionnaire list --campaign <campaign_id> --json
`,
    );

  program
    .command("seed")
    .description("Run deterministic database seed scenarios.")
    .requiredOption(
      "--scenario <scenario>",
      "Seed scenario name (S0_empty | S1_company_min | S1_multi_tenant_min | S2_org_basic | S4_campaign_draft | S5_campaign_started_no_answers).",
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

  const employeeCommand = program.command("employee").description("Employee directory operations.");

  employeeCommand
    .command("upsert")
    .description("Create/update employee record (supports soft deactivate via --is-active false).")
    .argument("<employee_id>", "Employee identifier.")
    .option("--email <email>", "Employee email.")
    .option("--first-name <firstName>", "Employee first name.")
    .option("--last-name <lastName>", "Employee last name.")
    .option("--phone <phone>", "Employee phone.")
    .option("--is-active <true|false>", "Set employee active state.")
    .option("--json", "Output machine-readable JSON.")
    .action(async (employeeId: string, options: EmployeeUpsertOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      let isActive: boolean | undefined;
      try {
        isActive = options.isActive
          ? parseBooleanOption(options.isActive, "--is-active")
          : undefined;
      } catch (error: unknown) {
        emitError(
          errorFromUnknown(error, "invalid_input", "Invalid --is-active value."),
          options.json,
        );
        return;
      }

      const result = await client.employeeUpsert({
        employeeId,
        email: options.email,
        firstName: options.firstName,
        lastName: options.lastName,
        phone: options.phone,
        ...(isActive !== undefined ? { isActive } : {}),
      });

      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(
          `Employee upserted: employee=${result.data.employeeId}, company=${result.data.companyId}, isActive=${result.data.isActive}, created=${result.data.created}`,
        );
      }
    });

  employeeCommand
    .command("list-active")
    .description("List active employees in active company.")
    .option("--json", "Output machine-readable JSON.")
    .action(async (options: JsonFlagOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      const result = await client.employeeListActive();
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(formatEmployeeListHuman(result.data));
      }
    });

  const orgCommand = program.command("org").description("Organization structure operations.");

  const orgDepartmentCommand = orgCommand
    .command("department")
    .description("Department hierarchy operations.");

  orgDepartmentCommand
    .command("move")
    .description("Move employee to another department and close/open history intervals.")
    .argument("<employee_id>", "Employee identifier.")
    .requiredOption("--to <department_id>", "Target department identifier.")
    .option("--json", "Output machine-readable JSON.")
    .action(async (employeeId: string, options: { to: string; json?: boolean }) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      const result = await client.orgDepartmentMove({
        employeeId,
        toDepartmentId: options.to,
      });
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(
          `Department moved: employee=${result.data.employeeId}, previous=${result.data.previousDepartmentId ?? "-"}, current=${result.data.departmentId}, changed=${result.data.changed}`,
        );
      }
    });

  orgCommand
    .command("set-manager")
    .description("Set employee direct manager and close/open manager history intervals.")
    .argument("<employee_id>", "Employee identifier.")
    .requiredOption("--manager <manager_employee_id>", "Manager employee identifier.")
    .option("--json", "Output machine-readable JSON.")
    .action(async (employeeId: string, options: { manager: string; json?: boolean }) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      const result = await client.orgManagerSet({
        employeeId,
        managerEmployeeId: options.manager,
      });
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(
          `Manager set: employee=${result.data.employeeId}, previous=${result.data.previousManagerEmployeeId ?? "-"}, current=${result.data.managerEmployeeId}, changed=${result.data.changed}`,
        );
      }
    });

  const campaignCommand = program.command("campaign").description("Campaign operations.");

  const campaignParticipantsCommand = campaignCommand
    .command("participants")
    .description("Campaign participants operations.");

  campaignParticipantsCommand
    .command("add-departments")
    .description("Add participants from selected departments (with descendants) in draft campaign.")
    .argument("<campaign_id>", "Campaign identifier.")
    .requiredOption(
      "--from-departments <department_ids...>",
      "Root department identifiers to include (descendants included).",
    )
    .option("--include-self <true|false>", "Set includeSelf for added participants.", "true")
    .option("--json", "Output machine-readable JSON.")
    .action(async (campaignId: string, options: CampaignParticipantsAddDepartmentsOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      let includeSelf: boolean | undefined;
      try {
        includeSelf =
          options.includeSelf !== undefined
            ? parseBooleanOption(options.includeSelf, "--include-self")
            : undefined;
      } catch (error: unknown) {
        emitError(
          errorFromUnknown(error, "invalid_input", "Invalid --include-self value."),
          options.json,
        );
        return;
      }

      const result = await client.campaignParticipantsAddFromDepartments({
        campaignId,
        departmentIds: options.fromDepartments,
        ...(includeSelf !== undefined ? { includeSelf } : {}),
      });
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(
          `Participants added: campaign=${result.data.campaignId}, added=${result.data.addedEmployeeIds.length}, total=${result.data.totalParticipants}`,
        );
      }
    });

  campaignCommand
    .command("snapshot")
    .description("Campaign snapshot operations.")
    .command("list")
    .description("List campaign employee snapshots (snapshot-on-start).")
    .requiredOption("--campaign <campaign_id>", "Campaign identifier.")
    .option("--json", "Output machine-readable JSON.")
    .action(async (options: CampaignSnapshotListOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      const result = await client.campaignSnapshotList({
        campaignId: options.campaign,
      });
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(formatCampaignSnapshotsHuman(result.data));
      }
    });

  const matrixCommand = program.command("matrix").description("Rater matrix operations.");

  matrixCommand
    .command("generate")
    .description("Generate suggested matrix assignments from participants and org structure.")
    .argument("<campaign_id>", "Campaign identifier.")
    .option(
      "--from-departments <department_ids...>",
      "Optional department filter for subject set (with descendants).",
    )
    .option("--json", "Output machine-readable JSON.")
    .action(async (campaignId: string, options: MatrixGenerateOptions) => {
      const client = await getClientWithActiveCompany(options.json);
      if (!client) {
        return;
      }

      const result = await client.matrixGenerateSuggested({
        campaignId,
        ...(options.fromDepartments ? { departmentIds: options.fromDepartments } : {}),
      });
      if (!emitResult(result, options.json)) {
        return;
      }

      if (!options.json && result.ok) {
        console.log(formatMatrixSuggestionsHuman(result.data));
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
