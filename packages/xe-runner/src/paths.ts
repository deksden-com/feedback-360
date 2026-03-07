import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

export const repoRoot = resolve(currentDir, "../../..");
export const scenariosRoot = resolve(repoRoot, "scenarios");
export const defaultRunsRoot = resolve(repoRoot, ".xe-runs");
