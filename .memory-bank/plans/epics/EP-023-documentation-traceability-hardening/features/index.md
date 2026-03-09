---
description: Feature catalog for EP-023-documentation-traceability-hardening with completed slice references.
purpose: Read to navigate the documentation hardening slices and audit completion evidence per category.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-023-documentation-traceability-hardening/index.md
epic: EP-023
---

# EP-023 — Feature catalog
Status: Completed (2026-03-09)

- [FT-0231 Code-to-doc JSDoc rollout](FT-0231-code-to-doc-jsdoc-rollout/index.md): раскатить `@docs` / `@see` на ключевые route-level, feature-area и CLI/client entrypoints. Читать, чтобы navigation из кода до SSoT стала реальной, а не только задекларированной.
- [FT-0232 Screen specs completion and deepening](FT-0232-screen-specs-completion/index.md): закрыть gaps по `SCR-*` и привести screen specs к одному шаблону. Читать, чтобы UI docs описывали экран системно: content, actions, states, domain constraints.
- [FT-0233 Docs-to-code ownership links](FT-0233-docs-to-code-ownership-links/index.md): добавить owning implementation/test paths в приоритетные specs и планы. Читать, чтобы из SSoT можно было быстро перейти к реальной реализации и coverage.
- [FT-0234 Metadata and frontmatter normalization](FT-0234-metadata-frontmatter-normalization/index.md): унифицировать `status`, frontmatter и legacy metadata patterns. Читать, чтобы memory-bank был машинно-предсказуемым и не жил на смешанных conventions.
- [FT-0235 Guides and reference completion](FT-0235-guides-reference-completion/index.md): довести `guides/reference` и быстрые lookup-docs для ролей, статусов и основных экранов. Читать, чтобы у проекта появился не только rich SSoT, но и usable operator/user reference.
- [FT-0236 Traceability audit automation](FT-0236-traceability-audit-automation/index.md): расширить automated audits на JSDoc links, screen specs coverage и docs ownership links. Читать, чтобы traceability regressions ловились до merge, а не при ручном чтении.
