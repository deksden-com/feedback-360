# Testing Index
Status: Draft (2026-03-03)

- [Test strategy](test-strategy.md) — уровни тестирования и минимальный набор “golden” сценариев. Читать, чтобы CI проверял именно критичные правила домена.
- [Seed scenarios](seed-scenarios.md) — правила и набор стандартных seed-состояний. Читать, чтобы писать тесты относительно стабильных фикстур и быстро воспроизводить баги.
- [Golden scenarios](golden-scenarios.md) — каноничные “сквозные” сценарии (setup→action→assert) и какие seeds они требуют. Читать, чтобы e2e и интеграционные тесты были минимальны, но покрывали критичные риски.
- [Traceability](traceability.md) — матрица “инвариант → spec → тест → seed”. Читать, чтобы видеть что уже покрыто, а что требует новых сценариев/фикстур.
- [Seed catalog](seeds/index.md) — каталог seed сценариев и их handles. Читать, чтобы тесты ссылались на стабильные ключи и быстро воспроизводились.
- [Scenario catalog](scenarios/index.md) — подробные golden сценарии (setup→action→assert) с конкретными командами/операциями. Читать, чтобы тесты реально проверяли инварианты, а не “что-то где-то работает”.
- [XE foundation](xe-foundation.md) — модель cross-epic scenarios: runs, phases, seeds, cleanup и environment guards. Читать, чтобы новый сценарный контур не спорил с existing acceptance/golden tests.
- [XE run model](xe-run-model.md) — lifecycle run-а, workspace state и policy retry/cleanup. Читать, чтобы CLI и runner имели единое понимание исполнения.
- [XE scenario layout](xe-scenario-layout.md) — структура каталога `scenarios/` и связь fixtures/phases/expected outputs. Читать, чтобы сценарии были машиночитаемыми и удобными для агентов.
- [UI automation contract](ui-automation-contract.md) — browser session strategy, screen specs, POM mapping и `data-testid` rules для XE. Читать, чтобы GUI-фазы сценариев были стабильными.
- [XE CLI contract](xe-cli-contract.md) — каталог минимальных команд XE для запуска, расследования и cleanup. Читать, чтобы агент и разработчик управляли сценариями через один интерфейс.
- [XE JSON schemas](xe-json-schemas.md) — draft-формы `scenario.json`, `state.json` и `bindings.json`. Читать, чтобы реализация раннера и сценариев была согласованной.
- [XE runner package structure](xe-runner-package.md) — как разделяются `scenarios/` и общий runtime package в монорепо. Читать, чтобы код раннера не расползался и не смешивался со сценарием.
