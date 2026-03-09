---
description: Small remaining follow-up after the post-EP-023 hardening wave: runtime enforcement of governed screen root test ids.
purpose: Read when we are ready to harden the last missing link between screen registry, testIdScope, and rendered DOM roots without spinning up a larger new epic yet.
status: Completed
date: 2026-03-09
parent: .memory-bank/plans/index.md
---

# Runtime UI traceability follow-up
Status: Completed (2026-03-09)

## Purpose
Зафиксировать единственный осознанно оставленный хвост после закрытия `post-EP-023` backlog: у нас уже есть strong static traceability between `screen_id`, `testIdScope`, docs and screenshot naming, но ещё нет достаточно жёсткой runtime-проверки, что governed screens действительно рендерят ожидаемый root `data-testid` в DOM.

## Why this follow-up exists
- `docs:audit` уже валидирует registry/frontmatter/screenshot/JSDoc contracts;
- `ui-automation-contract` уже требует `testIdScope`;
- но пока ещё нет системного guard, что route-level governed screen на runtime exposes the expected root selector for POM/e2e/traceability tooling.

## Scope
### 1. Define the governed screen runtime rule — Completed
**Goal**
- зафиксировать, какие screens обязаны рендерить root `data-testid`, derived from `testIdScope`.

**Acceptance**
- `ui-automation-contract` и `test-id-registry` явно описывают runtime requirement;
- rule differentiates between route-level screens, reusable components and non-governed fragments.

### 2. Add code-level/root-selector audit — Completed
**Goal**
- добавить automated verification that governed screens expose expected root selector in code or rendered DOM.

**Acceptance**
- drift between registry `testIdScope` and route-level root selector is caught before merge;
- false positives are low enough that contributors trust the check.

### 3. Align POM/root selector mapping — Completed
**Goal**
- убедиться, что screen POMs and route-level selectors use the same root convention.

**Acceptance**
- for governed screens, POM root lookup can be derived from `testIdScope` or references it explicitly;
- screen docs and POM mapping no longer require manual guesswork for the root selector.

## Suggested execution order
1. define runtime rule
2. add audit/check
3. align POM mapping

## Result
- runtime rule for governed root selectors is now documented in `ui-automation-contract.md` and `test-id-registry.md`;
- root selector mapping is now explicit in `spec/ui/pom/root-selectors.md`;
- `docs:audit` now verifies that route-level screens reference a registry-backed `screen_id`, use the matching `testIdScope`, and render the expected `<scope>-root` selector string.

## Escalation rule
Если этот follow-up начинает требовать broad UI refactor across many screens or new CI lanes, его нужно превратить в отдельный epic/mini-epic, а не растягивать как ad-hoc cleanup.

## Related docs
- [Post-EP-023 hardening backlog](post-ep023-hardening-backlog.md) — completed source backlog that intentionally left only this runtime gap open. Читать для контекста, почему остался именно этот хвост.
- [UI automation contract](../spec/testing/ui-automation-contract.md) — canonical contract for `screen_id`, `testIdScope`, POM and governed selectors. Читать первым перед любыми runtime checks.
- [Test ID registry](../spec/ui/test-id-registry.md) — registry and naming rule for selector scopes. Читать, чтобы derive expected root selector consistently.
- [Screen registry](../spec/ui/screen-registry.md) — canonical list of governed screens and their scopes. Читать, если нужно определить coverage of any new runtime audit.
