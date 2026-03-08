#!/usr/bin/env bash
set -euo pipefail

SCRIPT_PATH="${BASH_SOURCE[0]}"
if [[ "${SCRIPT_PATH}" != /* ]]; then
  SCRIPT_PATH="$(realpath "${SCRIPT_PATH}")"
fi
SCRIPT_DIR="$(dirname "${SCRIPT_PATH}")"
exec "${SCRIPT_DIR}/issue-token.sh" subject "$@"
