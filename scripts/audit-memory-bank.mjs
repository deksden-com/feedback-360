import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();

const getArg = (flag) => {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
};

const hasFlag = (flag) => process.argv.includes(flag);

const readText = async (relativePath) => {
  return readFile(path.join(repoRoot, relativePath), "utf8");
};

const parseFrontmatter = (contents) => {
  if (!contents.startsWith("---\n")) {
    return {};
  }

  const endIndex = contents.indexOf("\n---", 4);
  if (endIndex === -1) {
    return {};
  }

  const raw = contents.slice(4, endIndex).split("\n");
  const data = {};
  let currentArrayKey;

  for (const line of raw) {
    if (line.trim().length === 0) {
      continue;
    }

    if (line.startsWith("  - ") && currentArrayKey) {
      data[currentArrayKey].push(line.slice(4).trim());
      continue;
    }

    currentArrayKey = undefined;
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) {
      continue;
    }

    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();

    if (value.length === 0) {
      data[key] = [];
      currentArrayKey = key;
      continue;
    }

    data[key] = value.replace(/^['"]|['"]$/g, "");
  }

  return data;
};

const runEpicAudit = async (epicId) => {
  const epicsRoot = path.join(repoRoot, ".memory-bank", "plans", "epics");
  const epicDirName = (await readdir(epicsRoot)).find((entry) => entry.startsWith(`${epicId}-`));

  if (!epicDirName) {
    throw new Error(`Unable to find epic directory for ${epicId}.`);
  }

  const epicDir = path.join(epicsRoot, epicDirName);
  const epicIndexPath = path.join(epicDir, "index.md");
  const featureRoot = path.join(epicDir, "features");
  const verificationMatrixPath = path.join(
    repoRoot,
    ".memory-bank",
    "plans",
    "verification-matrix.md",
  );

  const featureDirNames = (await readdir(featureRoot)).filter((entry) => entry.startsWith("FT-"));
  const featureDocs = await Promise.all(
    featureDirNames.map(async (entry) => {
      const filePath = path.join(featureRoot, entry, "index.md");
      const contents = await readFile(filePath, "utf8");
      const status = contents.match(/^Status:\s+(.+)$/m)?.[1] ?? "UNKNOWN";
      const hasQualityEvidence = contents.includes("## Quality checks evidence");
      const hasAcceptanceEvidence = contents.includes("## Acceptance evidence");

      return {
        entry,
        status,
        hasQualityEvidence,
        hasAcceptanceEvidence,
      };
    }),
  );

  const epicIndex = await readFile(epicIndexPath, "utf8");
  const verificationMatrix = await readFile(verificationMatrixPath, "utf8");

  const expectedCounts = {
    totalFeatures: featureDocs.length,
    completedFeatures: featureDocs.filter((doc) => doc.status.startsWith("Completed")).length,
    evidenceConfirmedFeatures: featureDocs.filter(
      (doc) => doc.hasQualityEvidence && doc.hasAcceptanceEvidence,
    ).length,
  };

  const actualCounts = {
    totalFeatures: Number(epicIndex.match(/- `total_features`: (\d+)/)?.[1] ?? Number.NaN),
    completedFeatures: Number(
      epicIndex.match(/- `completed_features`: (\d+)/)?.[1] ?? Number.NaN,
    ),
    evidenceConfirmedFeatures: Number(
      epicIndex.match(/- `evidence_confirmed_features`: (\d+)/)?.[1] ?? Number.NaN,
    ),
  };

  const errors = [];

  if (
    !epicIndex.includes(`### ${epicId} execution evidence`) &&
    !verificationMatrix.includes(`### ${epicId} execution evidence`)
  ) {
    errors.push(`Verification matrix is missing section for ${epicId}.`);
  }

  for (const [key, expectedValue] of Object.entries(expectedCounts)) {
    const actualValue = actualCounts[key];
    if (Number.isNaN(actualValue)) {
      errors.push(`Epic progress report is missing ${key}.`);
      continue;
    }

    if (actualValue !== expectedValue) {
      errors.push(
        `Epic progress report mismatch for ${key}: expected ${expectedValue}, found ${actualValue}.`,
      );
    }
  }

  for (const feature of featureDocs) {
    if (feature.status.startsWith("Completed")) {
      if (!feature.hasQualityEvidence) {
        errors.push(`${feature.entry} is Completed but missing Quality checks evidence.`);
      }

      if (!feature.hasAcceptanceEvidence) {
        errors.push(`${feature.entry} is Completed but missing Acceptance evidence.`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Memory-bank epic audit failed for ${epicId}:\n${errors.map((error) => `- ${error}`).join("\n")}`,
    );
  }

  return {
    ok: true,
    mode: "epic",
    epicId,
    epicDir: path.relative(repoRoot, epicDir),
    ...expectedCounts,
  };
};

const runTraceabilityAudit = async () => {
  const errors = [];
  const warnings = [];

  const pageFiles = (await collectFiles("apps/web/src/app", (entry) => entry.endsWith("page.tsx"))).sort();
  for (const relativePath of pageFiles) {
    const contents = await readText(relativePath);
    if (!contents.includes("@screenId")) {
      errors.push(`${relativePath} is missing @screenId.`);
    }
    if (!contents.includes("@testIdScope")) {
      errors.push(`${relativePath} is missing @testIdScope.`);
    }
    if (!contents.includes("@docs")) {
      errors.push(`${relativePath} is missing @docs.`);
    }
  }

  const featureTargets = [
    "packages/core/src/features",
    "packages/client/src/features",
  ];
  for (const target of featureTargets) {
    const files = (await collectFiles(target, (entry) => entry.endsWith(".ts") && !entry.endsWith(".test.ts"))).sort();
    for (const relativePath of files) {
      const contents = await readText(relativePath);
      if (!contents.includes("@docs")) {
        errors.push(`${relativePath} is missing @docs.`);
      }
    }
  }

  for (const relativePath of [
    "packages/cli/src/index.ts",
    "packages/cli/src/legacy.ts",
    "packages/cli/src/auth-provisioning.ts",
  ]) {
    const contents = await readText(relativePath);
    if (!contents.includes("@docs")) {
      errors.push(`${relativePath} is missing @docs.`);
    }
  }

  const highValueUiComponents = [
    "apps/web/src/features/app-shell/components/internal-app-shell.tsx",
    "apps/web/src/features/app-shell/components/page-state.tsx",
    "apps/web/src/features/app-shell/lib/internal-app-shell.ts",
    "apps/web/src/features/app-shell/lib/home-dashboard.ts",
    "apps/web/src/features/results/components/results-shared.tsx",
    "apps/web/src/features/models-matrix/components/hr-model-editor.tsx",
    "apps/web/src/features/models-matrix/components/hr-matrix-builder.tsx",
    "apps/web/src/features/notifications-center/components/hr-notification-center.tsx",
    "apps/web/src/features/ops/components/ops-console.tsx",
  ];

  for (const relativePath of highValueUiComponents) {
    const contents = await readText(relativePath);
    if (!contents.includes("@docs")) {
      errors.push(`${relativePath} is missing @docs.`);
    }
  }

  const screenRegistry = await readText(".memory-bank/spec/ui/screen-registry.md");
  const registryRows = screenRegistry
    .split("\n")
    .filter((line) => line.startsWith("| `SCR-") && line.includes("|"));
  const registryEntries = registryRows
    .map((line) => {
      const match = line.match(
        /\|\s*`(SCR-[^`]+)`\s*\|\s*`([^`]+)`\s*\|.*\|\s*`([^`]+)`\s*\|$/,
      );

      if (!match) {
        return undefined;
      }

      return {
        screenId: match[1],
        route: match[2],
        testIdScope: match[3],
      };
    })
    .filter(Boolean);
  const registryIds = new Set(registryEntries.map((entry) => entry.screenId));
  const registryByScreenId = new Map(
    registryEntries.map((entry) => [entry.screenId, entry]),
  );

  for (const row of registryRows) {
    if (row.includes("| planned |")) {
      errors.push(`Screen registry still has planned entry: ${row}`);
    }
  }

  for (const relativePath of pageFiles) {
    const contents = await readText(relativePath);
    const screenId = contents.match(/@screenId\s+(SCR-[\w-]+)/)?.[1];
    const testIdScope = contents.match(/@testIdScope\s+([\w-]+)/)?.[1];

    if (!screenId || !testIdScope) {
      continue;
    }

    const registryEntry = registryByScreenId.get(screenId);
    if (!registryEntry) {
      errors.push(`${relativePath} references unknown screen id ${screenId}.`);
      continue;
    }

    if (registryEntry.testIdScope !== testIdScope) {
      errors.push(
        `${relativePath} has @testIdScope ${testIdScope}, but screen registry expects ${registryEntry.testIdScope} for ${screenId}.`,
      );
    }

    const expectedRootTestId = `${testIdScope}-root`;
    if (!contents.includes(expectedRootTestId)) {
      errors.push(
        `${relativePath} is missing governed root selector ${expectedRootTestId}.`,
      );
    }
  }

  const screenSpecFiles = (
    await collectFiles(".memory-bank/spec/ui/screens", (entry) => entry.endsWith(".md") && !entry.endsWith("index.md"))
  ).sort();

  for (const relativePath of screenSpecFiles) {
    const contents = await readText(relativePath);
    const frontmatter = parseFrontmatter(contents);
    for (const field of [
      "screen_id",
      "route",
      "actors",
      "test_id_scope",
      "implementation_files",
      "test_files",
    ]) {
      const value = frontmatter[field];
      if (
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0 && field !== "test_files")
      ) {
        errors.push(`${relativePath} is missing frontmatter field ${field}.`);
      }
    }

    if (!contents.includes("## Primary actions")) {
      errors.push(`${relativePath} is missing "## Primary actions".`);
    }
    if (!contents.includes("## States")) {
      errors.push(`${relativePath} is missing "## States".`);
    }
    if (!contents.includes("## Domain-specific behavior")) {
      errors.push(`${relativePath} is missing "## Domain-specific behavior".`);
    }

    for (const field of ["implementation_files", "test_files"]) {
      const value = frontmatter[field];
      if (!Array.isArray(value)) {
        continue;
      }
      for (const linkedPath of value) {
        if (linkedPath.length === 0) {
          continue;
        }
        try {
          await stat(path.join(repoRoot, linkedPath));
        } catch {
          errors.push(`${relativePath} references missing ${field} path ${linkedPath}.`);
        }
      }
    }
  }

  const referenceDocs = (
    await collectFiles(".memory-bank/guides/reference", (entry) => entry.endsWith(".md") && !entry.endsWith("index.md"))
  ).sort();
  if (referenceDocs.length < 6) {
    errors.push("guides/reference is still too thin; expected at least 6 reference docs.");
  }

  const governedFrontmatterDocs = [
    ...screenSpecFiles,
    ...(await collectFiles(".memory-bank/guides/tutorials", (entry) => entry.endsWith(".md"))),
    ...(await collectFiles(".memory-bank/guides/how-to", (entry) => entry.endsWith(".md"))),
    ...(await collectFiles(".memory-bank/guides/explanation", (entry) => entry.endsWith(".md"))),
    ...(await collectFiles(".memory-bank/guides/reference", (entry) => entry.endsWith(".md"))),
  ];

  for (const relativePath of governedFrontmatterDocs) {
    const contents = await readText(relativePath);
    const frontmatter = parseFrontmatter(contents);
    for (const field of ["description", "purpose", "status", "date"]) {
      if (!frontmatter[field]) {
        errors.push(`${relativePath} is missing frontmatter field ${field}.`);
      }
    }

    const linkedScreenIds = [];
    if (frontmatter.screen_id) {
      linkedScreenIds.push(frontmatter.screen_id);
    }
    if (Array.isArray(frontmatter.screen_ids)) {
      linkedScreenIds.push(...frontmatter.screen_ids);
    }

    for (const screenId of linkedScreenIds) {
      if (!registryIds.has(screenId)) {
        errors.push(`${relativePath} references unknown screen id ${screenId}.`);
      }
    }
  }

  const guideAssets = (
    await collectFiles(".memory-bank/guides/assets", (entry) =>
      /\.(png|jpe?g|webp|gif)$/i.test(entry),
    )
  ).sort();

  for (const relativePath of guideAssets) {
    const base = path.basename(relativePath);
    if (!base.includes("__(SCR-")) {
      errors.push(`${relativePath} is missing __(SCR-...) screenshot suffix.`);
      continue;
    }

    const match = base.match(/__\((SCR-[^)]+)\)\.[^.]+$/);
    if (!match) {
      errors.push(`${relativePath} has malformed screen-id screenshot suffix.`);
      continue;
    }

    if (!registryIds.has(match[1])) {
      errors.push(`${relativePath} references unknown screenshot screen id ${match[1]}.`);
    }
  }

  const inlineStatusDocs = (
    await collectFiles(".memory-bank", (entry) => entry.endsWith(".md"))
  ).sort();
  for (const relativePath of inlineStatusDocs) {
    const contents = await readText(relativePath);
    const frontmatter = parseFrontmatter(contents);
    const inlineStatus = contents.match(/^Status:\s+(.+)$/m)?.[1];
    if (!frontmatter.status || !inlineStatus) {
      continue;
    }

    const normalizedFrontmatter = String(frontmatter.status).trim().toLowerCase();
    const normalizedInline = inlineStatus.trim().toLowerCase();
    const matches =
      (normalizedFrontmatter === "active" && normalizedInline.startsWith("active")) ||
      (normalizedFrontmatter === "draft" && normalizedInline.startsWith("draft")) ||
      (normalizedFrontmatter === "completed" && normalizedInline.startsWith("completed"));

    if (!matches) {
      warnings.push(
        `${relativePath} has frontmatter status "${frontmatter.status}" but inline status "${inlineStatus}".`,
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Memory-bank traceability audit failed:\n${errors.map((error) => `- ${error}`).join("\n")}`,
    );
  }

  return {
    ok: true,
    mode: "traceability",
    routePages: pageFiles.length,
    screenSpecs: screenSpecFiles.length,
    referenceDocs: referenceDocs.length,
    warnings,
  };
};

async function collectFiles(rootRelativePath, predicate) {
  const root = path.join(repoRoot, rootRelativePath);
  const results = [];
  const walk = async (currentAbsolutePath) => {
    const entries = await readdir(currentAbsolutePath, { withFileTypes: true });
    for (const entry of entries) {
      const entryAbsolutePath = path.join(currentAbsolutePath, entry.name);
      if (entry.isDirectory()) {
        await walk(entryAbsolutePath);
        continue;
      }

      const relativePath = path.relative(repoRoot, entryAbsolutePath);
      if (predicate(relativePath)) {
        results.push(relativePath);
      }
    }
  };

  await walk(root);
  return results;
}

try {
  const epicId = getArg("--ep");
  const mode = getArg("--mode");
  const traceabilityRequested = hasFlag("--traceability") || mode === "traceability" || !epicId;

  const result = epicId ? await runEpicAudit(epicId) : await runTraceabilityAudit();
  if (epicId && traceabilityRequested && !hasFlag("--ep-only")) {
    await runTraceabilityAudit();
  }

  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
