import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

describe("FT-0142 api-contract feature-area layout", () => {
  it("keeps public index as a thin re-export surface", async () => {
    const rootIndex = await readFile(path.join(currentDir, "index.ts"), "utf8");

    expect(rootIndex).toContain('export * from "./campaigns"');
    expect(rootIndex).toContain('export * from "./questionnaires"');
    expect(rootIndex).not.toContain("parseCampaignCreateInput =");
    expect(rootIndex).not.toContain("parseQuestionnaireGetDraftInput =");
  });
});
