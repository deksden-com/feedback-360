# Domains & DNS (Vercel NS-first)
Status: Draft (2026-03-04)

## Scope
Этот документ — SSoT по управлению доменом `go360go.ru` и поддоменами (в т.ч. `beta.go360go.ru`), а также по DNS-записям для внешних интеграций (Resend/Supabase) в режиме “Vercel Nameservers”.

## Current setup (facts)
- Домены:
  - `go360go.ru` привязан к Vercel проекту `go360go-prod`.
  - `beta.go360go.ru` привязан к Vercel проекту `go360go-beta`.
- Git branches:
  - `go360go-prod` production branch: `main`.
  - `go360go-beta` production branch: `develop`.
- Nameservers: у регистратора выставлены Vercel NS, ожидаем DNS propagation (может занять часы).

## Principles
- Управляем DNS в одном месте: после делегирования NS на Vercel все записи (A/CNAME/TXT/MX) добавляем через Vercel.
- Не храним “секреты” в DNS. DKIM/SPF/DMARC записи — публичные и могут быть зафиксированы в репозитории.
- Для staging (beta) домена избегаем случайной рассылки: email safety (allowlist/no-send) на уровне приложения/окружения.

## Resend: DNS records to add (go360go.ru)
Источник: текущая конфигурация, полученная из Resend.

### DKIM
- Type: `TXT`
- Name: `resend._domainkey`
- Value:
  - `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDH91pgwwRvxJm3MpDwylu2pHdGyc8bhBmQSpo/K2BjKTini39zYewVeKwQLKG/TLOUgzu8dp3gcGZHNgXc75o/4Secje3z8lEdkI0ih32ctEPXlle1jqI+0bOPqiElwPkyj52Q5BBJzejb8myTCh2F+CRMdMP5TunH+X/QsP/CQIDAQAB`

### SPF / MAIL FROM subdomain
Resend использует поддомен `send.go360go.ru` для MAIL FROM.
- Type: `MX`
- Name: `send`
- Value: `feedback-smtp.us-east-1.amazonses.com`
- Priority: `10`

- Type: `TXT`
- Name: `send`
- Value: `v=spf1 include:amazonses.com ~all`

### DMARC (MVP)
- Type: `TXT`
- Name: `_dmarc`
- Value: `v=DMARC1; p=none;`

## Verification (must)
После того как NS реально делегируются на Vercel:
1) `vercel domains inspect go360go.ru` показывает зелёные NS (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`).
2) `vercel dns list go360go.ru` содержит записи DKIM/SPF/DMARC выше.
3) В Resend домен `go360go.ru` переходит в состояние Verified/Authenticated.

