import {
  type OperationContext,
  type OperationResult,
  type SeedRunInput,
  type SeedRunOutput,
  type SystemPingOutput,
  parseSeedRunInput,
  parseSeedRunOutput,
  parseSystemPingOutput,
} from "@feedback-360/api-contract";
import { runSeedScenario } from "@feedback-360/db";

import type { ClientRuntime } from "../shared/runtime";

export type SystemClientMethods = {
  seedRun(input: SeedRunInput): Promise<SeedRunOutput>;
  systemPing(context?: OperationContext): Promise<OperationResult<SystemPingOutput>>;
  setActiveContext(context: OperationContext): OperationResult<OperationContext>;
  getActiveContext(): OperationContext;
  setActiveCompany(companyId: string): OperationResult<{ companyId: string }>;
  getActiveCompany(): string | undefined;
};

export const createSystemClientMethods = (runtime: ClientRuntime): SystemClientMethods => ({
  seedRun: async (input) => {
    const parsedInput = parseSeedRunInput(input);
    const output = await runSeedScenario(parsedInput);
    return parseSeedRunOutput(output);
  },

  systemPing: async (context) =>
    runtime.invokeOperation({
      operation: "system.ping",
      input: {},
      context,
      parseOutput: parseSystemPingOutput,
    }),

  setActiveContext: runtime.setActiveContext,
  getActiveContext: runtime.getActiveContext,
  setActiveCompany: runtime.setActiveCompany,
  getActiveCompany: runtime.getActiveCompany,
});
