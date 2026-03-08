#!/usr/bin/env bash
set -euo pipefail

SCRIPT_PATH="${BASH_SOURCE[0]}"
if [[ "${SCRIPT_PATH}" != /* ]]; then
  SCRIPT_PATH="$(realpath "${SCRIPT_PATH}")"
fi
SCRIPT_DIR="$(dirname "${SCRIPT_PATH}")"
REPO_ROOT="$(realpath "${SCRIPT_DIR}/../../..")"
SCENARIO_ID="XE-001"

usage() {
  cat <<'EOF'
Usage:
  issue-token.sh <actor> [run-id]

Description:
  Issues an XE login token for the given actor in scenario XE-001.
  If run-id is omitted, the script resolves the latest active XE-001 run
  for the selected environment.

Environment variables:
  XE_ENV       local|beta (default: beta)
  XE_BASE_URL  App base URL (default: beta => https://beta.go360go.ru, local => http://127.0.0.1:3000)
  XE_OUTPUT    token|human (default: token)

Examples:
  ./scenarios/XE-001/scripts/issue-token.sh subject
  ./scenarios/XE-001/scripts/issue-token.sh manager RUN-20260307121525-c767edf3
  XE_OUTPUT=human ./scenarios/XE-001/scripts/issue-token.sh hr_admin
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -lt 1 ]]; then
  usage >&2
  exit 1
fi

ACTOR="$1"
RUN_ID="${2:-}"
XE_ENV="${XE_ENV:-beta}"
XE_OUTPUT="${XE_OUTPUT:-token}"

default_base_url() {
  case "${XE_ENV}" in
    beta) printf '%s' "https://beta.go360go.ru" ;;
    local) printf '%s' "http://127.0.0.1:3000" ;;
    *)
      echo "Unsupported XE_ENV: ${XE_ENV}. Use local or beta." >&2
      exit 1
      ;;
  esac
}

XE_BASE_URL="${XE_BASE_URL:-$(default_base_url)}"

extract_json() {
  node -e '
const fs = require("node:fs");
const text = fs.readFileSync(0, "utf8");
const tryExtract = (startIndex) => {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        const candidate = text.slice(startIndex, index + 1);
        try {
          JSON.parse(candidate);
          return candidate;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
};

for (let index = 0; index < text.length; index += 1) {
  if (text[index] !== "{") {
    continue;
  }

  const candidate = tryExtract(index);
  if (candidate) {
    process.stdout.write(candidate);
    process.exit(0);
  }
}

  process.stderr.write("Failed to locate JSON payload in CLI output.\n");
process.exit(1);
'
}

run_cli_capture() {
  (
    cd "${REPO_ROOT}"
    pnpm --filter @feedback-360/cli cli -- "$@"
  ) 2>&1
}

resolve_run_id() {
  local raw
  raw="$(run_cli_capture xe runs list --json)"
  printf '%s' "${raw}" \
    | extract_json \
    | node -e '
const fs = require("node:fs");
const payload = JSON.parse(fs.readFileSync(0, "utf8"));
const environment = process.argv[1];
const scenarioId = process.argv[2];
const items = (payload.data?.items ?? [])
  .filter((item) =>
    item.environment === environment &&
    item.scenarioId === scenarioId &&
    item.cleanupStatus === "active",
  )
  .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
if (items.length === 0) {
  process.stderr.write(`No active ${scenarioId} runs found for environment ${environment}.\n`);
  process.exit(1);
}
process.stdout.write(items[0].runId);
' "${XE_ENV}" "${SCENARIO_ID}"
}

if [[ -z "${RUN_ID}" ]]; then
  RUN_ID="$(resolve_run_id)"
fi

ISSUE_OUTPUT="$(
  run_cli_capture \
    xe auth issue "${RUN_ID}" \
    --actor "${ACTOR}" \
    --base-url "${XE_BASE_URL}" \
    --format token \
    --json
)"

PARSED="$(
  printf '%s' "${ISSUE_OUTPUT}" \
    | extract_json \
    | node -e '
const fs = require("node:fs");
const payload = JSON.parse(fs.readFileSync(0, "utf8"));
const data = payload.data;
if (!data?.token) {
  process.stderr.write("XE auth issue did not return a token.\n");
  process.exit(1);
}
const output = {
  actor: data.actor,
  runId: process.argv[1],
  baseUrl: data.baseUrl,
  token: data.token,
};
process.stdout.write(JSON.stringify(output));
' "${RUN_ID}"
)"

if [[ "${XE_OUTPUT}" == "human" ]]; then
  printf '%s' "${PARSED}" | node -e '
const fs = require("node:fs");
const data = JSON.parse(fs.readFileSync(0, "utf8"));
console.log(`XE token for ${data.actor}`);
console.log(`Run: ${data.runId}`);
console.log(`Login page: ${data.baseUrl}/auth/login`);
console.log("");
console.log(data.token);
'
  exit 0
fi

printf '%s' "${PARSED}" | node -e '
const fs = require("node:fs");
const data = JSON.parse(fs.readFileSync(0, "utf8"));
process.stdout.write(data.token);
'
