---
description: Quick reference for XE run creation, execution, inspection, and cleanup.
purpose: Read when you need the shortest operational summary of XE lifecycle commands without opening full XE specs.
status: Active
date: 2026-03-09
parent: .memory-bank/guides/reference/index.md
---

# XE run lifecycle — quick reference
Status: Active (2026-03-09)

## Core flow
- create a run: `xe runs create <scenario-id>`
- start a run: `xe runs start <run-id>`
- create + start in one step: `xe runs run <scenario-id>`
- inspect status: `xe runs status <run-id>`
- inspect artifacts: `xe artifacts dir <run-id>`

## Auth/bootstrap helpers
- issue actor token or storage-state: `xe auth issue <run-id> --actor <actor>`
- `XE-001` helper scripts wrap this for `subject`, `manager`, and `hr_admin`

## Cleanup
- delete a single run: `xe runs delete <run-id>`
- delete expired runs: `xe runs delete --expired`
- delete by date: `xe runs delete --before <date>` or `--since <date>`

## Lock
- check lock: `xe lock status`
- emergency unlock: `xe lock release --force`

## Related specs
- [XE run model](../../spec/testing/xe-run-model.md) — canonical lifecycle, lock, cleanup, and TTL semantics.
- [XE CLI contract](../../spec/testing/xe-cli-contract.md) — command surface and JSON/human output expectations.
- [XE scenario catalog](../../plans/xe/index.md) — available scenarios and scenario entrypoints.
