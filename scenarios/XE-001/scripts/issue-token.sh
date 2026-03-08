#!/usr/bin/env bash
set -euo pipefail

SCRIPT_PATH="${BASH_SOURCE[0]}"
if [[ "${SCRIPT_PATH}" != /* ]]; then
  SCRIPT_PATH="$(realpath "${SCRIPT_PATH}")"
fi
SCRIPT_DIR="$(dirname "${SCRIPT_PATH}")"
REPO_ROOT="$(realpath "${SCRIPT_DIR}/../../..")"
SCENARIO_ID="XE-001"
cd "${REPO_ROOT}"

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
  XE_AUTO_RUN_MISSING  1|0. Create a fresh run when no valid active run exists
                       (default: beta => 1, local => 0)

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
XE_AUTO_RUN_MISSING="${XE_AUTO_RUN_MISSING:-}"

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
    pnpm --filter @feedback-360/cli cli -- "$@"
  ) 2>&1
}

default_auto_run_missing() {
  case "${XE_ENV}" in
    beta) printf '%s' "1" ;;
    local) printf '%s' "0" ;;
    *)
      printf '%s' "0"
      ;;
  esac
}

if [[ -z "${XE_AUTO_RUN_MISSING}" ]]; then
  XE_AUTO_RUN_MISSING="$(default_auto_run_missing)"
fi

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
process.stdout.write(items.map((item) => item.runId).join("\n"));
' "${XE_ENV}" "${SCENARIO_ID}"
}

read_binding_pair() {
  local run_id="$1"
  local actor="$2"
  local bindings_path="${REPO_ROOT}/.xe-runs/${run_id}__${SCENARIO_ID}/bindings.json"

  if [[ ! -f "${bindings_path}" ]]; then
    return 1
  fi

  node -e '
const fs = require("node:fs");
const bindingsPath = process.argv[1];
const actor = process.argv[2];
const bindings = JSON.parse(fs.readFileSync(bindingsPath, "utf8"));
const actorBinding = bindings.actors?.[actor];
const companyId = bindings.company?.id;
if (!actorBinding?.userId || !companyId) {
  process.exit(1);
}
process.stdout.write(`${actorBinding.userId}|${companyId}`);
' "${bindings_path}" "${actor}"
}

validate_binding_in_db() {
  local user_id="$1"
  local company_id="$2"

  set -a
  # shellcheck disable=SC1091
  source "${REPO_ROOT}/.env" >/dev/null 2>&1 || true
  set +a

  pnpm --dir "${REPO_ROOT}" --filter @feedback-360/db exec node - "${user_id}" "${company_id}" <<'NODE' >/dev/null
const { Client } = require("pg");

const userId = process.argv[2];
const companyId = process.argv[3];

const client = new Client({
  connectionString: process.env.SUPABASE_DB_POOLER_URL || process.env.DATABASE_URL,
});

(async () => {
  await client.connect();
  const membership = await client.query(
    "select role from company_memberships where user_id = $1 and company_id = $2 limit 1",
    [userId, companyId],
  );
  await client.end();
  if (membership.rowCount !== 1) {
    process.exit(1);
  }
})().catch(async () => {
  try {
    await client.end();
  } catch {}
  process.exit(1);
});
NODE
}

pick_valid_run_id() {
  local candidates raw_candidates candidate pair user_id company_id
  raw_candidates="$(resolve_run_id)"

  while IFS= read -r candidate; do
    [[ -z "${candidate}" ]] && continue
    pair="$(read_binding_pair "${candidate}" "${ACTOR}" || true)"
    [[ -z "${pair}" ]] && continue
    user_id="${pair%%|*}"
    company_id="${pair#*|}"
    if validate_binding_in_db "${user_id}" "${company_id}"; then
      printf '%s' "${candidate}"
      return 0
    fi
  done <<< "${raw_candidates}"

  if [[ "${XE_AUTO_RUN_MISSING}" == "1" ]]; then
    create_fresh_run_id
    return 0
  fi

  cat >&2 <<EOF
No valid active ${SCENARIO_ID} run found for actor ${ACTOR} in environment ${XE_ENV}.
The XE run registry still exists locally, but the corresponding beta data is stale or missing.

Create a fresh beta run, then retry:
  pnpm --filter @feedback-360/cli cli -- xe runs run ${SCENARIO_ID} --env ${XE_ENV} --owner \${USER:-manual} --base-url ${XE_BASE_URL} --json
EOF
  exit 1
}

create_fresh_run_id() {
  local raw
  raw="$(run_cli_capture xe runs run "${SCENARIO_ID}" --env "${XE_ENV}" --owner "${USER:-manual}" --base-url "${XE_BASE_URL}" --json)"
  printf '%s' "${raw}" \
    | extract_json \
    | node -e '
const fs = require("node:fs");
const payload = JSON.parse(fs.readFileSync(0, "utf8"));
const runId = payload.data?.runId;
if (!runId) {
  process.stderr.write("Failed to create a fresh XE run.\n");
  process.exit(1);
}
process.stdout.write(runId);
'
}

if [[ -z "${RUN_ID}" ]]; then
  RUN_ID="$(pick_valid_run_id)"
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
