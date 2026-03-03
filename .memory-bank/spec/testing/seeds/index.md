# Seed catalog — index
Status: Draft (2026-03-03)

Цель: описать каждый seed scenario как “контракт тестов”: какие данные создаёт и какие `handles` возвращает.

- [Seed principles](../seed-scenarios.md): общие правила и требования к детерминизму/handles. Читать, чтобы seeds не превращались в случайные наборы данных.
- [S0_empty](s0-empty.md): пустая БД после миграций. Читать, чтобы стартовать тесты миграций/инициализации.
- [S1_company_min](s1-company-min.md): 1 company + 1 HR admin (user+employee+membership). Читать, чтобы тестировать базовый доступ и создание сущностей.
- [S1_company_roles_min (planned)](s1-company-roles-min.md): 1 company + полный набор ролей, чтобы проверять RBAC. Читать, чтобы тесты могли исполнять операции под разными ролями детерминированно.
- [S1_multi_tenant_min (planned)](s1-multi-tenant-min.md): 2 companies + 1 user в двух memberships. Читать, чтобы тестировать изоляцию и переключение компании.
- [S2_org_basic](s2-org-basic.md): базовая оргструктура. Читать, чтобы тестировать автогенерацию матрицы и снапшоты.
- [S3_model_indicators](s3-model-indicators.md): модель компетенций indicators. Читать, чтобы тестировать анкеты/расчёты indicators.
- [S3_model_levels (planned)](s3-model-levels.md): модель компетенций levels (1..4 + UNSURE). Читать, чтобы тестировать GS9 и уровневые агрегации без смешения с indicators.
- [S4_campaign_draft](s4-campaign-draft.md): draft campaign. Читать, чтобы тестировать мутабельность в draft.
- [S5_campaign_started_no_answers](s5-campaign-started-no-answers.md): started, без ответов. Читать, чтобы тестировать “до lock”.
- [S6_campaign_started_some_drafts](s6-campaign-started-some-drafts.md): started+locked. Читать, чтобы тестировать lock semantics.
- [S7_campaign_started_some_submitted](s7-campaign-started-some-submitted.md): submitted ответы. Читать, чтобы тестировать анонимность/агрегации.
- [S8_campaign_ended](s8-campaign-ended.md): ended campaign. Читать, чтобы тестировать read-only.
- [S9_campaign_completed_with_ai](s9-campaign-completed-with-ai.md): completed + AI aggregates. Читать, чтобы тестировать видимость processed текста и запрет raw.
