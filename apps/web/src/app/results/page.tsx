import { InternalAppShell } from "@/components/internal-app-shell";
import { PageEmptyState, PageErrorState, PageStateScreen } from "@/components/page-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "./_shared";

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

export default async function ResultsMyDashboardPage({
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
      title: "Не удалось открыть результаты",
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

  const campaignId = getQueryValue(params?.campaignId);
  const client = createInprocClient();

  const assignedQuestionnaires = await client.questionnaireListAssigned({}, resolved.context);
  const campaignOptions = assignedQuestionnaires.ok
    ? Array.from(
        new Map(
          assignedQuestionnaires.data.items.map((item) => [
            item.campaignId,
            {
              campaignId: item.campaignId,
              label: item.campaignName ?? item.campaignId,
            },
          ]),
        ).values(),
      ).sort((left, right) => left.label.localeCompare(right.label))
    : [];

  if (!campaignId) {
    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/results"
        title="Мои результаты"
        subtitle="Выберите кампанию для просмотра итогов."
      >
        <ResultsPageLayout
          title="Мои результаты"
          subtitle="Выберите кампанию для просмотра итогов."
        >
          <PageEmptyState
            title="Пока не выбрана кампания"
            description="Укажите campaignId вручную или выберите одну из кампаний, доступных по вашим анкетам."
            testId="results-my-empty"
          />
          <form
            className="grid gap-3 rounded-md border p-4"
            method="get"
            data-testid="my-results-form"
          >
            <div className="space-y-2">
              <Label htmlFor="campaignId">Campaign ID</Label>
              <Input id="campaignId" name="campaignId" placeholder="19000000-..." />
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
          {campaignOptions.length > 0 ? (
            <Card data-testid="my-results-suggestions">
              <CardHeader>
                <CardTitle className="text-lg">Быстрый выбор кампании</CardTitle>
                <CardDescription>
                  Используем кампании из ваших анкет, чтобы быстрее открыть готовый отчёт.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {campaignOptions.map((campaign) => (
                  <Button key={campaign.campaignId} asChild variant="outline">
                    <a href={`/results?campaignId=${encodeURIComponent(campaign.campaignId)}`}>
                      {campaign.label}
                    </a>
                  </Button>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </ResultsPageLayout>
      </InternalAppShell>
    );
  }

  const dashboard = await client.resultsGetMyDashboard(
    {
      campaignId,
      smallGroupPolicy: "merge_to_other",
      anonymityThreshold: 3,
    },
    resolved.context,
  );

  if (!dashboard.ok) {
    const state = getFriendlyErrorCopy(dashboard.error, {
      title: "Не удалось загрузить результаты",
      description: "Проверьте campaignId или попробуйте открыть страницу позже.",
    });

    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/results"
        title="Мои результаты"
        subtitle={state.description}
      >
        <ResultsPageLayout title="Мои результаты" subtitle={state.description}>
          <PageErrorState
            title={state.title}
            description={state.description}
            actions={[{ href: "/results", label: "Сбросить фильтры", variant: "outline" }]}
            testId="results-my-error"
          />
        </ResultsPageLayout>
      </InternalAppShell>
    );
  }

  return (
    <InternalAppShell
      context={resolved.context}
      currentPath="/results"
      title="Мои результаты"
      subtitle="Агрегаты по завершённой кампании 360."
    >
      <ResultsPageLayout title="Мои результаты" subtitle="Агрегаты по завершённой кампании 360.">
        {campaignOptions.length > 0 ? (
          <Card data-testid="results-my-campaign-switcher">
            <CardHeader>
              <CardTitle className="text-lg">Переключение между кампаниями</CardTitle>
              <CardDescription>
                Откройте другой завершённый отчёт, не теряя контекст текущей компании.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {campaignOptions.map((campaign) => (
                <Button
                  key={campaign.campaignId}
                  asChild
                  variant={campaign.campaignId === campaignId ? "secondary" : "outline"}
                  data-testid={`results-my-campaign-${campaign.campaignId}`}
                >
                  <a href={`/results?campaignId=${encodeURIComponent(campaign.campaignId)}`}>
                    {campaign.label}
                  </a>
                </Button>
              ))}
            </CardContent>
          </Card>
        ) : null}
        <ResultsSummaryCard
          campaignId={dashboard.data.campaignId}
          subjectEmployeeId={dashboard.data.subjectEmployeeId}
          campaignLabel={
            campaignOptions.find((item) => item.campaignId === dashboard.data.campaignId)?.label
          }
          subjectLabel="Мой профиль"
          overallScore={dashboard.data.overallScore}
          modelKind={dashboard.data.modelKind}
          anonymityThreshold={dashboard.data.anonymityThreshold}
          openTextCount={dashboard.data.openText.length}
          viewerLabel="Личная витрина результатов"
        />
        <ResultsGroupCard data={dashboard.data} />
        <ResultsCompetenciesCard data={dashboard.data} />
        <ResultsOpenTextCard items={dashboard.data.openText} showRawText={false} />
      </ResultsPageLayout>
    </InternalAppShell>
  );
}
