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

## SimpleLogin: domain verification (go360go.ru)
Источник: верификационная TXT запись SimpleLogin (для включения custom domain aliases).

- Type: `TXT`
- Name: `@`
- Value: `sl-verification=huyfnasbfreflxnkwipwryqcjzbqcz`

## SimpleLogin: inbound mail routing + DKIM + DMARC hardening
Источник: DNS инструкции SimpleLogin для custom domain aliases (входящая почта + подписи/политики).

### MX (inbound)
- Type: `MX`
- Name: `@`
- Priority: `10`
- Target: `mx1.simplelogin.co.`

- Type: `MX`
- Name: `@`
- Priority: `20`
- Target: `mx2.simplelogin.co.`

### DKIM (CNAME selectors)
- Type: `CNAME`
- Name: `dkim._domainkey`
- Value: `dkim._domainkey.simplelogin.co.`

- Type: `CNAME`
- Name: `dkim02._domainkey`
- Value: `dkim02._domainkey.simplelogin.co.`

- Type: `CNAME`
- Name: `dkim03._domainkey`
- Value: `dkim03._domainkey.simplelogin.co.`

### DMARC (policy)
⚠️ У нас уже есть transactional email через Resend. DMARC `p=quarantine` со строгим выравниванием (`adkim=s; aspf=s`) допустим, но требует чтобы любые “настоящие” отправители с `From: *@go360go.ru` были корректно настроены (DKIM/SPF alignment), иначе письма могут попасть в spam/quarantine.

- Type: `TXT`
- Name: `_dmarc`
- Value: `v=DMARC1; p=quarantine; pct=100; adkim=s; aspf=s`

## Verification (must)
После того как NS реально делегируются на Vercel:
1) `vercel domains inspect go360go.ru` показывает зелёные NS (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`).
2) `vercel dns list go360go.ru` содержит записи DKIM/SPF/DMARC выше.
3) В Resend домен `go360go.ru` переходит в состояние Verified/Authenticated.
4) В SimpleLogin домен проходит verification и custom-domain aliases принимают входящие письма.

## Change log (operator notes)
- 2026-03-04: DNS записи Resend добавлены в Vercel DNS (ожидаем завершение делегирования NS).
- 2026-03-04: DNS записи SimpleLogin (MX/CNAME DKIM) добавлены в Vercel DNS; DMARC обновлён на `p=quarantine` со strict alignment.
