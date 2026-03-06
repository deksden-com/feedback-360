import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const coreRoot = path.resolve(currentDir, "..");

describe("FT-0142 core feature-area layout", () => {
  it("keeps the root dispatcher as a thin composition point", async () => {
    const rootIndex = await readFile(path.join(coreRoot, "index.ts"), "utf8");

    expect(rootIndex).not.toContain("const runCampaignList");
    expect(rootIndex).not.toContain("const runQuestionnaireListAssigned");
    expect(rootIndex).toContain("const operationHandlers");
    expect(rootIndex).toContain('from "./features/campaigns"');
    expect(rootIndex).toContain('from "./features/questionnaires"');
  });
});
