---
description: Quick reference for beta/prod access, release verification shortcuts, and where to look during environment checks.
purpose: Read when you need the shortest path to environment-specific verification without opening the full deployment runbook.
status: Active
date: 2026-03-09
parent: .memory-bank/guides/reference/index.md
---

# Environment access and verification — quick reference
Status: Active (2026-03-09)

## Domains
- `beta.go360go.ru` → staging / `develop`
- `go360go.ru` → production / `main`

## Typical verification
- GitHub checks green for the merge commit
- Vercel deployment `Ready`
- browser smoke on the changed user-facing paths
- `pnpm docs:audit` if docs/memory-bank changed

## Useful commands
- `gh run list --workflow ci.yml --limit 10`
- `gh run view <run-id>`
- `vercel inspect beta.go360go.ru`
- `vercel inspect go360go.ru`
- `PLAYWRIGHT_BASE_URL=https://beta.go360go.ru pnpm --filter @feedback-360/web test:smoke:beta`

## Related specs
- [Git flow](../../spec/operations/git-flow.md) — promotion path and required checks.
- [Runbook](../../spec/operations/runbook.md) — detailed release checklist and investigation flow.
- [Deployment architecture](../../spec/operations/deployment-architecture.md) — environments and external dependencies.
