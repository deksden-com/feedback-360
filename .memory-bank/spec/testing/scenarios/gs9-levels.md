# GS9 — Levels mode/distribution rules (planned)
Status: Draft (2026-03-03)

## Setup
- Seed: `S7_campaign_started_some_submitted --variant levels_tie` (planned)
- В данных есть:
  - UNSURE ответы,
  - tie по mode (например 2 и 3 поровну).

## Action
1) Compute/view results.

## Assertions
- UNSURE не входит в `n_valid` и mean.
- При tie `mode_level = null`, распределение показывается.

## Client API ops (v1)
- results get (см. `results.get*`)
