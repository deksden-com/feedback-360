import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

describe("FT-0142 client feature-area layout", () => {
  it("keeps createClient as a feature-method composer", async () => {
    const rootIndex = await readFile(path.join(currentDir, "index.ts"), "utf8");

    expect(rootIndex).toContain("createClientRuntime");
    expect(rootIndex).toContain("createCampaignsClientMethods");
    expect(rootIndex).toContain("createQuestionnairesClientMethods");
    expect(rootIndex).not.toContain("campaignList: async");
    expect(rootIndex).not.toContain("questionnaireListAssigned: async");
  });
});
