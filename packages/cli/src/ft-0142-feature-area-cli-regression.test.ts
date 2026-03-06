import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

describe("FT-0142 cli entrypoint layout", () => {
  it("keeps the public CLI entrypoint thin while preserving runCli", async () => {
    const rootIndex = await readFile(path.join(currentDir, "index.ts"), "utf8");
    const legacyEntry = await readFile(path.join(currentDir, "legacy.ts"), "utf8");

    expect(rootIndex).toContain('import { cliReady, runCli } from "./legacy"');
    expect(rootIndex).toContain("if (isDirectRun)");
    expect(rootIndex).not.toContain('program.command("campaign")');
    expect(legacyEntry).toContain('.command("campaign")');
    expect(legacyEntry).toContain('.command("questionnaire")');
  });
});
