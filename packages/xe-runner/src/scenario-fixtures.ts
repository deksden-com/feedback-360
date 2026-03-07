import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { scenariosRoot } from "./paths";

export const loadScenarioFixture = async <T>(
  scenarioId: string,
  relativePath: string,
): Promise<T> => {
  const raw = await readFile(join(scenariosRoot, scenarioId, "fixtures", relativePath), "utf8");
  return JSON.parse(raw) as T;
};
