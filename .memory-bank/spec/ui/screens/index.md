# UI screen specs — index
Status: Draft (2026-03-07)

Этот раздел хранит **screen specs**: нормативные документы по отдельным экранам системы.

Правило:
- каждый screen spec обязан иметь frontmatter с `screen_id`, `route`, `actors`, `test_id_scope`;
- значения берём из [Screen registry](../screen-registry.md), а не придумываем локально.

- [Screen spec template](../../mbb/templates/index.md) — шаблон для новых screen spec документов. Читать, чтобы все экраны описывались одинаково и без дублей.
- [Internal home](internal-home.md) — role-aware home/dashboard shell. Читать, чтобы XE и UI-фичи одинаково понимали landing surface приложения.
- [HR employees](hr-employees.md) — каталог сотрудников с CRUD-toolbar и summary rows. Читать, чтобы traceability и guides ссылались на единый contract списка сотрудников.
- [HR employee detail](hr-employee-detail.md) — карточка сотрудника с summary, provisioning и history секциями. Читать, чтобы profile walkthrough и automation проверяли один и тот же surface.
- [HR org](hr-org.md) — иерархия подразделений и selected-node detail pane. Читать, чтобы hierarchy UX и evidence были привязаны к каноническому описанию.
- [HR campaigns](hr-campaigns.md) — список кампаний и operational portfolio HR. Читать, чтобы campaign list/dashboard changes не расходились с accepted screen contract.
- [HR campaign detail](hr-campaign-detail.md) — operational detail кампании с progress/lock/AI summary. Читать, чтобы guides и screenshots ссылались на единый detail surface.
- [Questionnaire inbox](questionnaire-inbox.md) — список назначенных анкет, фильтры и CTA. Читать, чтобы automation и UX опирались на один contract.
- [Questionnaire fill](questionnaire-fill.md) — структура анкеты, progress, save draft, submit, read-only states. Читать, чтобы GUI сценарии и тесты надёжно управляли заполнением.
- [Employee results dashboard](employee-results-dashboard.md) — employee-facing results surface. Читать, чтобы visibility/processed-text contract был стабилен.
- [Manager results dashboard](manager-results-dashboard.md) — team/results surface руководителя. Читать, чтобы role-specific visibility и team walkthrough были зафиксированы одинаково.
- [HR results workbench](hr-results-workbench.md) — HR-facing results surface с richer visibility. Читать, чтобы HR screenshots и traceability вели к одному SSoT.

Правило: screen spec описывает **purpose, actors, sections, actions, states, permissions** и ссылается на соответствующий POM mapping, а не дублирует селекторы/код.
