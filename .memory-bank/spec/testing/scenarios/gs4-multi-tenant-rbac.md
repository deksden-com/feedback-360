# GS4 — Multi-tenant isolation & RBAC (planned)
Status: Draft (2026-03-03)

## Setup
- Seed: `S1_multi_tenant_min`

## Action
1) User в контексте company A пытается читать/менять сущности company B.
2) HR Reader читает результаты и raw-комментарии (MVP исключение).
3) HR Reader пытается менять матрицу/кампанию.

## Assertions
- Доступ к company B запрещён (403/404).
- HR Reader: read-only, но raw видит (MVP).
- Любые write операции для HR Reader запрещены.

## Execution slicing
- FT-0021 закрывает tenant-isolation subset (active company A/B + cross-company read `not_found|forbidden`).
- FT-0022 закрывает RBAC subset (hr_reader write запреты и read-only поведение).

## Client API ops (v1)
- read ops: `results.getHrView` (и прочие list/get)
- write ops (запрещены для hr_reader): `campaign.weights.set`, `matrix.set`, `campaign.setModelVersion`, …

## CLI example
1) `seed --scenario S1_multi_tenant_min --json`
2) `company use <handles.company.a>`
3) попытка вызвать команду, указывающую `company.b` сущности → ожидаем `forbidden`/`not_found`.
