# FT-0004 — Domains & DNS (Resend records, Vercel NS)
Status: In progress (2026-03-04)

## User value
- Команда может воспроизводимо настроить домен и email-аутентификацию (DKIM/SPF/DMARC) без “поиска по чатам”.
- Инфраструктура готова к включению transactional email без проблем с deliverability.

## Deliverables
- Ops spec:
  - `.memory-bank/spec/operations/domains-and-dns.md`
- Ops index updated:
  - `.memory-bank/spec/operations/index.md`
- Convenience note for local/ops:
  - `.env.example` содержит публичные DNS записи Resend (как заметки).

## Context (SSoT links)
- [Operations index](../../../../../spec/operations/index.md) — где лежат runbook/DNS/retention. Читать, чтобы не создавать “второй runbook”.
- [Domains & DNS](../../../../../spec/operations/domains-and-dns.md) — DNS SSoT для `go360go.ru`. Читать, чтобы применять записи корректно.

## Implementation plan
1) Зафиксировать требуемые DNS записи Resend (DKIM/SPF/DMARC) в ops spec.
2) Добавить краткое дублирование “как заметку” в `.env.example` (public-only).
3) После делегирования NS на Vercel: применить записи через `vercel dns add`.

## Scenarios (auto acceptance)
Этот slice требует внешнего DNS propagation, поэтому auto-acceptance оформляем как “operator check”:

### Setup
- Domain: `go360go.ru` делегирован на NS Vercel (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`).
- Resend: домен добавлен в Resend.

### Action
- Добавить записи через Vercel:
  - `vercel dns add go360go.ru resend._domainkey TXT '<value>'`
  - `vercel dns add go360go.ru send MX feedback-smtp.us-east-1.amazonses.com 10`
  - `vercel dns add go360go.ru send TXT 'v=spf1 include:amazonses.com ~all'`
  - `vercel dns add go360go.ru _dmarc TXT 'v=DMARC1; p=none;'`

### Assert
- `vercel dns list go360go.ru` содержит записи.
- В Resend домен = Verified/Authenticated.

## Tests
- N/A (infra-only).

## Docs updates (SSoT)
- Уже выполнено в deliverables этого slice.

