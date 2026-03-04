import {
  type SeedRunInput,
  type SeedRunOutput,
  parseSeedRunInput,
  parseSeedRunOutput,
} from "@feedback-360/api-contract";
import { runSeedScenario } from "@feedback-360/db";

export type Feedback360Client = {
  seedRun(input: SeedRunInput): Promise<SeedRunOutput>;
};

export const createInprocClient = (): Feedback360Client => {
  return {
    seedRun: async (input) => {
      const parsedInput = parseSeedRunInput(input);
      const output = await runSeedScenario(parsedInput);
      return parseSeedRunOutput(output);
    },
  };
};

export const clientReady = true;
