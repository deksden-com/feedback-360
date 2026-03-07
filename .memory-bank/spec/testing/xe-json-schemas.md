# XE JSON schema drafts
Status: Draft (2026-03-07)

Цель: зафиксировать каноничную форму `scenario.json`, `state.json` и `bindings.json` до начала реализации раннера.

## `scenario.json`

```json
{
  "id": "XE-001",
  "version": "1",
  "name": "First 360 campaign happy path",
  "description": "Human-readable summary",
  "envPolicy": {
    "allowedEnvironments": ["local", "beta"],
    "allowConcurrentRuns": false
  },
  "seed": {
    "handle": "XE-001-first-campaign",
    "extends": "system"
  },
  "artifacts": {
    "rootDir": ".xe-runs",
    "retainDays": 30
  },
  "phasePolicy": {
    "defaultFailurePolicy": "fail_run"
  },
  "phases": [
    {
      "id": "phase-01-seed",
      "title": "Apply seed",
      "handler": "phase-01-seed.ts",
      "failurePolicy": "fail_run",
      "requiredArtifacts": ["bindings.json", "assertions.json"]
    }
  ]
}
```

Правила:
- `scenario.json` задаёт каркас и policies, а не заменяет phase code;
- `handler` — относительный путь к phase handler внутри сценария;
- `failurePolicy` для MVP: `fail_run` или `rerun_with_reset`.

## `state.json`

```json
{
  "runId": "RUN-20260307-001",
  "scenarioId": "XE-001",
  "scenarioVersion": "1",
  "environment": "beta",
  "status": "running",
  "currentPhaseId": "phase-03-bootstrap-sessions",
  "startedAt": "2026-03-07T10:00:00Z",
  "updatedAt": "2026-03-07T10:10:00Z",
  "bindingsPath": "phase-01-seed/bindings.json",
  "phases": {
    "phase-01-seed": {
      "status": "passed",
      "startedAt": "2026-03-07T10:00:01Z",
      "finishedAt": "2026-03-07T10:00:05Z",
      "artifacts": [
        "phase-01-seed/bindings.json",
        "phase-01-seed/assertions.json"
      ]
    },
    "phase-02-start-campaign": {
      "status": "passed"
    },
    "phase-03-bootstrap-sessions": {
      "status": "running"
    }
  },
  "notes": []
}
```

Правила:
- `state.json` — SSoT runtime state run-а;
- сохраняем только то, что нужно для orchestration, resume, расследования и artifact navigation;
- большие данные и snapshots живут в отдельных artifacts, а не инлайнятся в `state.json`.

## `bindings.json`

```json
{
  "company": {
    "id": "cmp_123",
    "slug": "xe-001-company"
  },
  "campaign": {
    "id": "cam_456"
  },
  "modelVersion": {
    "id": "mod_789"
  },
  "actors": {
    "hr_admin": {
      "userId": "usr_1",
      "employeeId": "emp_1",
      "email": "xe001-hr@example.test"
    },
    "subject": {
      "userId": "usr_3",
      "employeeId": "emp_3",
      "email": "xe001-subject@example.test"
    }
  },
  "questionnaires": {
    "manager_to_subject": "q_002",
    "peer_1_to_subject": "q_003"
  },
  "createdEntities": [
    { "type": "company", "id": "cmp_123" },
    { "type": "campaign", "id": "cam_456" }
  ]
}
```

Правила:
- cleanup опирается только на явные bindings/traces из этого файла и run registry;
- `createdEntities` помогает cleanup/inspection, но не заменяет typed sections;
- если какая-то сущность создаётся run-ом и не попала в bindings/traces — это defect.
