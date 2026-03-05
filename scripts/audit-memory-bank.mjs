import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();

const getArg = (flag) => {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
};

const epicId = getArg("--ep");

if (!epicId) {
  console.error("Missing required --ep <EP-XXX> argument.");
  process.exit(1);
}

const epicsRoot = path.join(repoRoot, ".memory-bank", "plans", "epics");
const epicDirName = (await readdir(epicsRoot)).find((entry) => entry.startsWith(`${epicId}-`));

if (!epicDirName) {
  console.error(`Unable to find epic directory for ${epicId}.`);
  process.exit(1);
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
  completedFeatures: Number(epicIndex.match(/- `completed_features`: (\d+)/)?.[1] ?? Number.NaN),
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
  console.error(`Memory-bank audit failed for ${epicId}:`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      epicId,
      epicDir: path.relative(repoRoot, epicDir),
      ...expectedCounts,
    },
    null,
    2,
  ),
);
