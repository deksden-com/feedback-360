import { InternalAppShell } from "@/components/internal-app-shell";
import { PageErrorState, PageStateScreen } from "@/components/page-state";
import { Button } from "@/components/ui/button";
import { applyDebugPageDelay } from "@/lib/debug-page-delay";
import { resolveAppOperationContext } from "@/lib/operation-context";
import { getFriendlyErrorCopy } from "@/lib/page-state";
import { redirect } from "next/navigation";

import { HrCampaignWorkbench } from "./_workbench";

const getQueryValue = (value: string | string[] | undefined): string | undefined => {
  if (typeof value === "string") {
    return value.trim().length > 0 ? value.trim() : undefined;
  }
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0] ?? "";
    return first.trim().length > 0 ? first.trim() : undefined;
  }
  return undefined;
};

export default async function HrCampaignsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : undefined;
  await applyDebugPageDelay(params?.debugDelayMs);
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
      title: "Не удалось открыть HR workbench",
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

  const isHrRole = resolved.context.role === "hr_admin" || resolved.context.role === "hr_reader";
  if (!isHrRole) {
    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/hr/campaigns"
        title="HR Campaign Workbench"
        subtitle="Доступно только для ролей HR Admin и HR Reader."
      >
        <PageErrorState
          title="Раздел доступен только HR-роли"
          description="Откройте личные результаты или переключите активную компанию, где у вас есть роль HR Admin или HR Reader."
          actions={[{ href: "/", label: "Вернуться на главную", variant: "outline" }]}
          testId="hr-campaigns-forbidden"
        />
      </InternalAppShell>
    );
  }

  const initialCampaignId = getQueryValue(params?.campaignId);

  return (
    <InternalAppShell
      context={resolved.context}
      currentPath="/hr/campaigns"
      title="HR Campaign Workbench"
      subtitle="Draft/start/matrix/progress/retry AI через typed client API."
    >
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <a href="/results/hr">HR результаты</a>
        </Button>
      </div>
      <HrCampaignWorkbench role={resolved.context.role} initialCampaignId={initialCampaignId} />
    </InternalAppShell>
  );
}
