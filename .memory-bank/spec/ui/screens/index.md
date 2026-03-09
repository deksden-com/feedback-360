---
description: Index of UI screen specifications and screen-level contracts.
purpose: Read to find the canonical contract for a screen before changing UI, guides, or automation.
status: Active
date: 2026-03-09
parent: .memory-bank/spec/ui/index.md
---


# UI screen specs — index
Status: Active (2026-03-09)

Этот раздел хранит **screen specs**: нормативные документы по отдельным экранам системы.

Правило:
- каждый screen spec обязан иметь frontmatter с `screen_id`, `route`, `actors`, `test_id_scope`;
- каждый screen spec обязан ссылаться на owning implementation path и primary tests;
- значения берём из [Screen registry](../screen-registry.md), а не придумываем локально.

- [Screen spec template](../../mbb/templates/index.md) — шаблон для новых screen spec документов. Читать, чтобы все экраны описывались одинаково и без дублей.
- [Internal home](internal-home.md) — role-aware home/dashboard shell. Читать, чтобы XE и UI-фичи одинаково понимали landing surface приложения.
- [Auth login](auth-login.md) — стартовый вход по magic link и test-only token helper. Читать, чтобы auth entry surface имел канонический contract.
- [Auth callback](auth-callback.md) — системный экран завершения auth callback. Читать, чтобы callback flow был описан как отдельный surface, а не только как код.
- [Company switcher](company-switcher.md) — выбор активной компании после входа. Читать, чтобы multi-company flow имел единый contract.
- [HR employees](hr-employees.md) — каталог сотрудников с CRUD-toolbar и summary rows. Читать, чтобы traceability и guides ссылались на единый contract списка сотрудников.
- [HR employee detail](hr-employee-detail.md) — карточка сотрудника с summary, provisioning и history секциями. Читать, чтобы profile walkthrough и automation проверяли один и тот же surface.
- [HR employee create](hr-employee-create.md) — создание сотрудника в HR directory. Читать, чтобы create-flow был описан отдельно от каталога и detail view.
- [HR org](hr-org.md) — иерархия подразделений и selected-node detail pane. Читать, чтобы hierarchy UX и evidence были привязаны к каноническому описанию.
- [HR models](hr-models.md) — каталог моделей и версий. Читать, чтобы model portfolio surface был нормирован для HR flows.
- [HR model detail](hr-model-detail.md) — просмотр и редактирование конкретной model version. Читать, чтобы model editor имел отдельный канонический contract.
- [HR model create](hr-model-create.md) — создание новой draft model version. Читать, чтобы create-flow не растворялся в общем model editor.
- [HR campaigns](hr-campaigns.md) — список кампаний и operational portfolio HR. Читать, чтобы campaign list/dashboard changes не расходились с accepted screen contract.
- [HR campaign create](hr-campaign-create.md) — создание новой draft campaign. Читать, чтобы start of HR campaign flow был отдельно описан и трассируем.
- [HR campaign detail](hr-campaign-detail.md) — operational detail кампании с progress/lock/AI summary. Читать, чтобы guides и screenshots ссылались на единый detail surface.
- [HR campaign edit](hr-campaign-edit.md) — редактирование mutable campaign settings. Читать, чтобы draft/edit restrictions были описаны явно.
- [HR campaign matrix](hr-campaign-matrix.md) — assignment matrix surface для кампании. Читать, чтобы matrix builder и freeze rules ссылались на один contract.
- [Questionnaire inbox](questionnaire-inbox.md) — список назначенных анкет, фильтры и CTA. Читать, чтобы automation и UX опирались на один contract.
- [Questionnaire fill](questionnaire-fill.md) — структура анкеты, progress, save draft, submit, read-only states. Читать, чтобы GUI сценарии и тесты надёжно управляли заполнением.
- [Employee results dashboard](employee-results-dashboard.md) — employee-facing results surface. Читать, чтобы visibility/processed-text contract был стабилен.
- [Manager results dashboard](manager-results-dashboard.md) — team/results surface руководителя. Читать, чтобы role-specific visibility и team walkthrough были зафиксированы одинаково.
- [HR results workbench](hr-results-workbench.md) — HR-facing results surface с richer visibility. Читать, чтобы HR screenshots и traceability вели к одному SSoT.
- [HR notifications](hr-notifications.md) — reminders/templates/delivery diagnostics surface. Читать, чтобы notification center имел полноценный screen contract.
- [Ops console](ops.md) — operational health and diagnostics surface. Читать, чтобы ops UI не жил только в коде и evidence.
- [Sentry example](sentry-example.md) — developer-facing observability example screen. Читать, чтобы even non-business debug surfaces оставались трассируемыми.

Правило: screen spec описывает **purpose, actors, sections, actions, states, permissions** и ссылается на соответствующий POM mapping, а не дублирует селекторы/код.
