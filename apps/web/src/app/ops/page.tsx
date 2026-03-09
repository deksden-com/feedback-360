import { InternalAppShell } from "@/components/internal-app-shell";
import { PageErrorState, PageStateScreen } from "@/components/page-state";
import { applyDebugPageDelay } from "@/lib/debug-page-delay";
import { resolveAppOperationContext } from "@/lib/operation-context";
import { getFriendlyErrorCopy } from "@/lib/page-state";
import { createOperationError } from "@feedback-360/api-contract";
import { createInprocClient } from "@feedback-360/client";
import { redirect } from "next/navigation";

import { OpsConsole } from "@/features/ops/components/ops-console";

/**
 * Ops console screen.
 * @docs .memory-bank/spec/ui/screens/ops.md
 * @see .memory-bank/spec/ui/screen-registry.md
 * @screenId SCR-OPS
 * @testIdScope scr-ops
 */
export default async function OpsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  await applyDebugPageDelay(params.debugDelayMs);

  const resolved = await resolveAppOperationContext();
  if (!resolved.ok) {
    if (resolved.error.code === "unauthenticated") {
      redirect("/auth/login");
    }
    if (resolved.error.code === "active_company_required") {
      redirect("/select-company");
    }
  }

  if (!resolved.ok) {
    const state = getFriendlyErrorCopy(resolved.error, {
      title: "Не удалось открыть ops console",
      description: "Попробуйте обновить страницу или войти заново.",
    });
    return (
      <PageStateScreen>
        <PageErrorState
          title={state.title}
          description={state.description}
          actions={[{ href: "/auth/login", label: "Перейти ко входу", variant: "outline" }]}
        />
      </PageStateScreen>
    );
  }

  if (resolved.context.role !== "hr_admin" && resolved.context.role !== "hr_reader") {
    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/ops"
        title="Ops console"
        subtitle="Раздел доступен только HR ролям."
      >
        <PageErrorState
          title="Недостаточно прав для ops console"
          description="Переключите активную компанию, где у вас есть HR-роль."
          actions={[{ href: "/", label: "Вернуться на главную", variant: "outline" }]}
        />
      </InternalAppShell>
    );
  }

  const client = createInprocClient();
  const [campaigns, health, aiDiagnostics, auditTrail] = await Promise.all([
    client.campaignList({}, resolved.context),
    client.opsHealthGet({}, resolved.context),
    client.opsAiDiagnosticsList({}, resolved.context),
    client.opsAuditList({ limit: 50 }, resolved.context),
  ]);

  if (!campaigns.ok || !health.ok || !aiDiagnostics.ok || !auditTrail.ok) {
    const error = !campaigns.ok
      ? campaigns.error
      : !health.ok
        ? health.error
        : !aiDiagnostics.ok
          ? aiDiagnostics.error
          : !auditTrail.ok
            ? auditTrail.error
            : createOperationError("invalid_input", "Ops console load failed.");
    const state = getFriendlyErrorCopy(error, {
      title: "Не удалось загрузить ops console",
      description: "Health или diagnostics временно недоступны.",
    });
    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/ops"
        title="Ops console"
        subtitle={state.description}
      >
        <PageErrorState
          title={state.title}
          description={state.description}
          actions={[{ href: "/ops", label: "Обновить страницу", variant: "outline" }]}
        />
      </InternalAppShell>
    );
  }

  return (
    <InternalAppShell
      context={resolved.context}
      currentPath="/ops"
      title="Ops console"
      subtitle="Health, release, AI diagnostics и audit trail для beta/prod support."
    >
      <div data-testid="scr-ops-root">
        <OpsConsole
          role={resolved.context.role}
          campaigns={campaigns.data.items}
          initialHealth={health.data}
          initialAiDiagnostics={aiDiagnostics.data}
          initialAudit={auditTrail.data}
        />
      </div>
    </InternalAppShell>
  );
}
