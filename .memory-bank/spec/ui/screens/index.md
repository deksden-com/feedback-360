# UI screen specs — index
Status: Draft (2026-03-07)

Этот раздел хранит **screen specs**: нормативные документы по отдельным экранам системы.

- [Screen spec template](../../mbb/templates/index.md) — шаблон для новых screen spec документов. Читать, чтобы все экраны описывались одинаково и без дублей.
- [Internal home](internal-home.md) — role-aware home/dashboard shell. Читать, чтобы XE и UI-фичи одинаково понимали landing surface приложения.
- [Questionnaire inbox](questionnaire-inbox.md) — список назначенных анкет, фильтры и CTA. Читать, чтобы automation и UX опирались на один contract.
- [Questionnaire fill](questionnaire-fill.md) — структура анкеты, progress, save draft, submit, read-only states. Читать, чтобы GUI сценарии и тесты надёжно управляли заполнением.
- [Employee results dashboard](employee-results-dashboard.md) — employee-facing results surface. Читать, чтобы visibility/processed-text contract был стабилен.

Правило: screen spec описывает **purpose, actors, sections, actions, states, permissions** и ссылается на соответствующий POM mapping, а не дублирует селекторы/код.
