# Client API Index (typed contract + client)
Status: Draft (2026-03-03)

Цель: описать **единый контракт операций**, который используют UI и CLI, и правила typed client.

- [Overview](overview.md): зачем typed contract/client, и какие границы у UI/CLI. Читать, чтобы “тонкие клиенты” не обрастали логикой.
- [Operations](operations.md): стиль операций (input/output), версии, идемпотентность, пагинация (если нужна). Читать, чтобы добавлять операции консистентно.
- [Operation catalog](operation-catalog.md): список операций v1 (черновик) и связка с CLI командами. Читать, чтобы UI/CLI вызывали одно и то же и чтобы vertical slices были полными.
- [Errors](errors.md): shape ошибок, коды, маппинг на HTTP/CLI. Читать, чтобы ошибки были машиночитаемыми и стабильными.
- [Auth & tenancy context](auth-and-tenancy.md): как в операции попадает `company_id` (active company) и как проверяем membership. Читать, чтобы multi-tenant не ломался.
- [Transport](transport.md): HTTP vs in-proc вызовы. Читать, чтобы тесты/CLI могли использовать один и тот же клиент без расхождений.

