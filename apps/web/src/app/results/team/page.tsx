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

/**
 * Manager results dashboard screen.
 * @screenId SCR-RESULTS-MANAGER
 * @testIdScope scr-results-manager
 */
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
        <ResultsPageLayout
          title="Результаты команды"
          subtitle="Доступно только для роли Manager."
          testId="scr-results-manager-root"
        >
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
  const client = createInprocClient();
  const assignedQuestionnaires = await client.questionnaireListAssigned({}, resolved.context);
  const managerAssignments = assignedQuestionnaires.ok
    ? assignedQuestionnaires.data.items.filter((item) => item.raterRole === "manager")
    : [];
  const fallbackAssignments =
    assignedQuestionnaires.ok && managerAssignments.length === 0
      ? assignedQuestionnaires.data.items
      : [];
  const availableAssignments =
    managerAssignments.length > 0 ? managerAssignments : fallbackAssignments;
  const campaignOptions = Array.from(
    new Map(
      availableAssignments.map((item) => [
        item.campaignId,
        {
          campaignId: item.campaignId,
          label: item.campaignName ?? item.campaignId,
        },
      ]),
    ).values(),
  ).sort((left, right) => left.label.localeCompare(right.label));
  const subjectOptions = Array.from(
    new Map(
      availableAssignments
        .filter((item) => !campaignId || item.campaignId === campaignId)
        .map((item) => [
          item.subjectEmployeeId,
          {
            subjectEmployeeId: item.subjectEmployeeId,
            label: item.subjectDisplayName ?? item.subjectEmployeeId,
            campaignId: item.campaignId,
          },
        ]),
    ).values(),
  ).sort((left, right) => left.label.localeCompare(right.label));

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
          testId="scr-results-manager-root"
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
          {campaignOptions.length > 0 ? (
            <Card data-testid="results-team-campaign-switcher">
              <CardHeader>
                <CardTitle className="text-lg">Доступные кампании</CardTitle>
                <CardDescription>
                  Берём кампании из ваших manager-назначений, чтобы сразу перейти к нужному отчёту.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {campaignOptions.map((campaign) => (
                  <Button key={campaign.campaignId} asChild variant="outline">
                    <a href={`/results/team?campaignId=${encodeURIComponent(campaign.campaignId)}`}>
                      {campaign.label}
                    </a>
                  </Button>
                ))}
              </CardContent>
            </Card>
          ) : null}
          {subjectOptions.length > 0 ? (
            <Card data-testid="results-team-subject-switcher">
              <CardHeader>
                <CardTitle className="text-lg">Подчинённые с результатами</CardTitle>
                <CardDescription>
                  Видны только сотрудники, которые уже встречаются в ваших manager-назначениях.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {subjectOptions.map((subject) => (
                  <Button key={subject.subjectEmployeeId} asChild variant="outline">
                    <a
                      href={`/results/team?campaignId=${encodeURIComponent(
                        subject.campaignId,
                      )}&subjectEmployeeId=${encodeURIComponent(subject.subjectEmployeeId)}`}
                    >
                      {subject.label}
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
        <ResultsPageLayout
          title="Результаты команды"
          subtitle={state.description}
          testId="scr-results-manager-root"
        >
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
        testId="scr-results-manager-root"
      >
        <Card data-testid="results-team-toolbar">
          <CardHeader>
            <CardTitle className="text-lg">Навигация по команде</CardTitle>
            <CardDescription>
              Переключайте кампанию и сотрудника без ручного ввода идентификаторов.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {campaignOptions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {campaignOptions.map((campaign) => (
                  <Button
                    key={campaign.campaignId}
                    asChild
                    variant={campaign.campaignId === campaignId ? "secondary" : "outline"}
                    data-testid={`results-team-campaign-${campaign.campaignId}`}
                  >
                    <a
                      href={`/results/team?campaignId=${encodeURIComponent(campaign.campaignId)}${
                        campaign.campaignId === campaignId && subjectEmployeeId
                          ? `&subjectEmployeeId=${encodeURIComponent(subjectEmployeeId)}`
                          : ""
                      }`}
                    >
                      {campaign.label}
                    </a>
                  </Button>
                ))}
              </div>
            ) : null}
            {subjectOptions.length > 0 ? (
              <div className="flex flex-wrap gap-2" data-testid="results-team-subject-switcher">
                {subjectOptions.map((subject) => (
                  <Button
                    key={subject.subjectEmployeeId}
                    asChild
                    variant={
                      subject.subjectEmployeeId === subjectEmployeeId ? "secondary" : "outline"
                    }
                    data-testid={`results-team-subject-${subject.subjectEmployeeId}`}
                  >
                    <a
                      href={`/results/team?campaignId=${encodeURIComponent(
                        campaignId,
                      )}&subjectEmployeeId=${encodeURIComponent(subject.subjectEmployeeId)}`}
                    >
                      {subject.label}
                    </a>
                  </Button>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
        <ResultsSummaryCard
          campaignId={dashboard.data.campaignId}
          subjectEmployeeId={dashboard.data.subjectEmployeeId}
          campaignLabel={
            campaignOptions.find((item) => item.campaignId === dashboard.data.campaignId)?.label
          }
          subjectLabel={
            subjectOptions.find(
              (item) => item.subjectEmployeeId === dashboard.data.subjectEmployeeId,
            )?.label
          }
          overallScore={dashboard.data.overallScore}
          modelKind={dashboard.data.modelKind}
          anonymityThreshold={dashboard.data.anonymityThreshold}
          openTextCount={dashboard.data.openText.length}
          viewerLabel="Витрина руководителя"
        />
        <ResultsGroupCard data={dashboard.data} />
        <ResultsCompetenciesCard data={dashboard.data} />
        <ResultsOpenTextCard items={dashboard.data.openText} showRawText={false} />
      </ResultsPageLayout>
    </InternalAppShell>
  );
}
