# Epic template
Status: Template

## Epic <EP-XXX> — <Name>

### Goal (user value)
Кому и какую ценность доставляет этот эпик.

### Scope (in / out)
- In scope: …
- Out of scope: …

### Features (vertical slices)
Список фич внутри эпика со ссылками на их документы (каждая фича имеет сценарии и тесты).

### Progress report (evidence-based)
- `as_of`: YYYY-MM-DD
- `total_features`: N
- `completed_features`: N
- `evidence_confirmed_features`: N
- verification link: ссылка на `Verification matrix` секцию execution evidence по эпику.

### Dependencies
- External: …
- Internal: …

### Risks & mitigations
- Risk: … → Mitigation: …

### Definition of done
- Все фичи имеют сценарии (setup→action→assert) и seeds/fixtures.
- Golden scenario(и) покрывают критичные риски (если эпик их добавляет).
- Execution evidence по затронутым FT/GS записано в [Verification matrix](../../plans/verification-matrix.md) (и на него есть ссылка из PR).
