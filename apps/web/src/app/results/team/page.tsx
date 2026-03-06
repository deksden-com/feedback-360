import { InternalAppShell } from "@/components/internal-app-shell";
import { PageEmptyState, PageErrorState, PageStateScreen } from "@/components/page-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyDebugPageDelay } from "@/lib/debug-page-delay";
import { resolveAppOperationContext } from "@/lib/operation-context";
import { getFriendlyErrorCopy } from "@/lib/page-state";
import { createInprocClient } from "@feedback-360/client";
import { redirect } from "next/navigation";

import {
  ResultsCompetenciesCard,
  ResultsGroupCard,
  ResultsOpenTextCard,
  ResultsPageLayout,
  ResultsSummaryCard,
} from "../_shared";

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

export default async function ResultsTeamDashboardPage({
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
      title: "Не удалось открыть результаты команды",
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

  if (resolved.context.role !== "manager") {
    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/results/team"
        title="Результаты команды"
        subtitle="Доступно только для роли Manager."
      >
        <ResultsPageLayout title="Результаты команды" subtitle="Доступно только для роли Manager.">
          <PageErrorState
            title="Эта витрина доступна только руководителю"
            description="Откройте личные результаты или переключите активную компанию, где у вас есть роль manager."
            actions={[{ href: "/results", label: "Открыть мои результаты", variant: "outline" }]}
            testId="results-team-forbidden"
          />
        </ResultsPageLayout>
      </InternalAppShell>
    );
  }

  const campaignId = getQueryValue(params?.campaignId);
  const subjectEmployeeId = getQueryValue(params?.subjectEmployeeId);

  if (!campaignId || !subjectEmployeeId) {
    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/results/team"
        title="Результаты команды"
        subtitle="Укажите campaignId и subjectEmployeeId для загрузки результатов сотрудника."
      >
        <ResultsPageLayout
          title="Результаты команды"
          subtitle="Выберите кампанию и сотрудника, чтобы открыть витрину руководителя."
        >
          <PageEmptyState
            title="Нужно выбрать сотрудника и кампанию"
            description="Укажите campaignId и subjectEmployeeId вручную, чтобы открыть агрегаты конкретного сотрудника."
            testId="results-team-empty"
          />
          <form
            className="grid gap-3 rounded-md border p-4"
            method="get"
            data-testid="team-results-form"
          >
            <div className="space-y-2">
              <Label htmlFor="campaignId">Campaign ID</Label>
              <Input id="campaignId" name="campaignId" defaultValue={campaignId} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subjectEmployeeId">Subject employee ID</Label>
              <Input
                id="subjectEmployeeId"
                name="subjectEmployeeId"
                defaultValue={subjectEmployeeId}
              />
            </div>
            <div>
              <button
                type="submit"
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                Открыть результаты
              </button>
            </div>
          </form>
        </ResultsPageLayout>
      </InternalAppShell>
    );
  }

  const client = createInprocClient();
  const dashboard = await client.resultsGetTeamDashboard(
    {
      campaignId,
      subjectEmployeeId,
      smallGroupPolicy: "merge_to_other",
      anonymityThreshold: 3,
    },
    resolved.context,
  );

  if (!dashboard.ok) {
    const state = getFriendlyErrorCopy(dashboard.error, {
      title: "Не удалось загрузить результаты команды",
      description: "Проверьте campaignId и subjectEmployeeId или попробуйте позже.",
    });

    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/results/team"
        title="Результаты команды"
        subtitle={state.description}
      >
        <ResultsPageLayout title="Результаты команды" subtitle={state.description}>
          <PageErrorState
            title={state.title}
            description={state.description}
            actions={[{ href: "/results/team", label: "Сбросить фильтры", variant: "outline" }]}
            testId="results-team-error"
          />
        </ResultsPageLayout>
      </InternalAppShell>
    );
  }

  return (
    <InternalAppShell
      context={resolved.context}
      currentPath="/results/team"
      title="Результаты команды"
      subtitle="Витрина руководителя: только агрегаты и обработанные комментарии."
    >
      <ResultsPageLayout
        title="Результаты команды"
        subtitle="Витрина руководителя: только агрегаты и обработанные комментарии."
      >
        <ResultsSummaryCard
          campaignId={dashboard.data.campaignId}
          subjectEmployeeId={dashboard.data.subjectEmployeeId}
          overallScore={dashboard.data.overallScore}
          modelKind={dashboard.data.modelKind}
        />
        <ResultsGroupCard data={dashboard.data} />
        <ResultsCompetenciesCard data={dashboard.data} />
        <ResultsOpenTextCard items={dashboard.data.openText} showRawText={false} />
      </ResultsPageLayout>
    </InternalAppShell>
  );
}
