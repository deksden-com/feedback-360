export const seedScenarios = ["S0_empty", "S1_company_min", "S2_org_basic"] as const;

export type SeedScenario = (typeof seedScenarios)[number];

export type SeedRunInput = {
  scenario: SeedScenario;
  variant?: string;
};

export type SeedRunOutput = {
  scenario: SeedScenario;
  variant?: string;
  handles: Record<string, string>;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isSeedScenario = (value: string): value is SeedScenario => {
  return seedScenarios.includes(value as SeedScenario);
};

const toStringMap = (value: unknown, fieldName: string): Record<string, string> => {
  if (!isRecord(value)) {
    throw new Error(`${fieldName} must be an object.`);
  }

  const entries = Object.entries(value);
  const map: Record<string, string> = {};

  for (const [key, entryValue] of entries) {
    if (typeof entryValue !== "string") {
      throw new Error(`${fieldName}.${key} must be a string.`);
    }

    map[key] = entryValue;
  }

  return map;
};

export const parseSeedRunInput = (value: unknown): SeedRunInput => {
  if (!isRecord(value)) {
    throw new Error("seed.run input must be an object.");
  }

  const scenario = value.scenario;
  if (typeof scenario !== "string" || !isSeedScenario(scenario)) {
    throw new Error(`Unknown seed scenario: ${String(scenario)}`);
  }

  const variant = value.variant;
  if (variant !== undefined && typeof variant !== "string") {
    throw new Error("seed.run input.variant must be a string when provided.");
  }

  return { scenario, variant };
};

export const parseSeedRunOutput = (value: unknown): SeedRunOutput => {
  if (!isRecord(value)) {
    throw new Error("seed.run output must be an object.");
  }

  const scenario = value.scenario;
  if (typeof scenario !== "string" || !isSeedScenario(scenario)) {
    throw new Error(`Unknown seed scenario in output: ${String(scenario)}`);
  }

  const variant = value.variant;
  if (variant !== undefined && typeof variant !== "string") {
    throw new Error("seed.run output.variant must be a string when provided.");
  }

  return {
    scenario,
    variant,
    handles: toStringMap(value.handles, "seed.run output.handles"),
  };
};

export const apiContractReady = true;
