import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = resolve(import.meta.dirname, "../../../..");

describe("FT-0141 feature-area target structure", () => {
  test("documents canonical areas, shared policy, and thin composition roots", async () => {
    const boundariesDoc = await readFile(
      resolve(repoRoot, ".memory-bank/spec/project/feature-area-boundaries.md"),
      "utf8",
    );

    for (const featureArea of [
      "identity-tenancy",
      "org",
      "models",
      "campaigns",
      "matrix",
      "questionnaires",
      "results",
      "notifications",
      "ai",
    ]) {
      expect(boundariesDoc).toContain(`- \`${featureArea}\``);
    }

    expect(boundariesDoc).toContain("`shared` допустим только");
    expect(boundariesDoc).toContain("`packages/core/src/index.ts`");
    expect(boundariesDoc).toContain("`packages/api-contract/src/index.ts`");
    expect(boundariesDoc).toContain("`packages/client/src/index.ts`");
    expect(boundariesDoc).toContain("`packages/cli/src/index.ts`");
  });
});
