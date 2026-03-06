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

export default async function ResultsHrViewPage({
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
      title: "Не удалось открыть HR результаты",
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
        currentPath="/results/hr"
        title="HR результаты"
        subtitle="Доступно только для HR ролей."
      >
        <ResultsPageLayout title="HR результаты" subtitle="Доступно только для HR ролей.">
          <PageErrorState
            title="Эта витрина доступна только HR-роли"
            description="Откройте личные результаты или переключите активную компанию, где у вас есть HR-доступ."
            actions={[{ href: "/results", label: "Открыть мои результаты", variant: "outline" }]}
            testId="results-hr-forbidden"
          />
        </ResultsPageLayout>
      </InternalAppShell>
    );
  }

  const campaignId = getQueryValue(params?.campaignId);
  const subjectEmployeeId = getQueryValue(params?.subjectEmployeeId);
  const textView = getQueryValue(params?.textView);
  const normalizedTextView =
    textView === "raw" || textView === "processed" || textView === "combined"
      ? textView
      : "combined";
  const client = createInprocClient();
  const [campaigns, employees, snapshot] = await Promise.all([
    client.campaignList({}, resolved.context),
    client.employeeListActive({}, resolved.context),
    campaignId
      ? client.campaignSnapshotList({ campaignId }, resolved.context)
      : Promise.resolve(undefined),
  ]);
  const campaignOptions = campaigns.ok
    ? campaigns.data.items.map((item) => ({
        campaignId: item.campaignId,
        label: item.name,
        status: item.status,
      }))
    : [];
  const subjectOptions = snapshot?.ok
    ? snapshot.data.items
        .map((item) => ({
          subjectEmployeeId: item.employeeId,
          label: [item.firstName, item.lastName].filter(Boolean).join(" ").trim() || item.email,
        }))
        .sort((left, right) => left.label.localeCompare(right.label))
    : employees.ok
      ? employees.data.items
          .map((item) => ({
            subjectEmployeeId: item.employeeId,
            label: [item.firstName, item.lastName].filter(Boolean).join(" ").trim() || item.email,
          }))
          .sort((left, right) => left.label.localeCompare(right.label))
      : [];

  if (!campaignId || !subjectEmployeeId) {
    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/results/hr"
        title="HR результаты"
        subtitle="Укажите campaignId и subjectEmployeeId для загрузки полной HR-витрины."
      >
        <ResultsPageLayout
          title="HR результаты"
          subtitle="Выберите кампанию и сотрудника, чтобы открыть HR-витрину."
        >
          <PageEmptyState
            title="Нужно выбрать сотрудника и кампанию"
            description="Укажите campaignId и subjectEmployeeId вручную, чтобы открыть полную HR-витрину."
            testId="results-hr-empty"
          />
          <form
            className="grid gap-3 rounded-md border p-4"
            method="get"
            data-testid="hr-results-form"
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
            <Card data-testid="results-hr-campaign-switcher">
              <CardHeader>
                <CardTitle className="text-lg">Кампании</CardTitle>
                <CardDescription>
                  Откройте completed или `ai_failed` кампанию из HR-каталога.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {campaignOptions.map((campaign) => (
                  <Button key={campaign.campaignId} asChild variant="outline">
                    <a href={`/results/hr?campaignId=${encodeURIComponent(campaign.campaignId)}`}>
                      {campaign.label}
                    </a>
                  </Button>
                ))}
              </CardContent>
            </Card>
          ) : null}
          {subjectOptions.length > 0 ? (
            <Card data-testid="results-hr-subject-switcher">
              <CardHeader>
                <CardTitle className="text-lg">Сотрудники</CardTitle>
                <CardDescription>
                  После выбора кампании список берётся из snapshot, чтобы HR работал с исторически
                  зафиксированным составом.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {subjectOptions.map((subject) => (
                  <Button key={subject.subjectEmployeeId} asChild variant="outline">
                    <a
                      href={`/results/hr?subjectEmployeeId=${encodeURIComponent(
                        subject.subjectEmployeeId,
                      )}${campaignId ? `&campaignId=${encodeURIComponent(campaignId)}` : ""}`}
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

  const view = await client.resultsGetHrView(
    {
      campaignId,
      subjectEmployeeId,
      smallGroupPolicy: "merge_to_other",
      anonymityThreshold: 3,
    },
    resolved.context,
  );

  if (!view.ok) {
    const state = getFriendlyErrorCopy(view.error, {
      title: "Не удалось загрузить HR результаты",
      description: "Проверьте campaignId и subjectEmployeeId или попробуйте позже.",
    });

    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/results/hr"
        title="HR результаты"
        subtitle={state.description}
      >
        <ResultsPageLayout title="HR результаты" subtitle={state.description}>
          <PageErrorState
            title={state.title}
            description={state.description}
            actions={[{ href: "/results/hr", label: "Сбросить фильтры", variant: "outline" }]}
            testId="results-hr-error"
          />
        </ResultsPageLayout>
      </InternalAppShell>
    );
  }

  const showRawText = resolved.context.role === "hr_admin";
  const subtitle = showRawText
    ? "Полная HR-витрина: raw + processed + summary комментарии."
    : "HR Reader витрина: processed + summary комментарии без raw текста.";

  return (
    <InternalAppShell
      context={resolved.context}
      currentPath="/results/hr"
      title="HR результаты"
      subtitle={subtitle}
    >
      <ResultsPageLayout title="HR результаты" subtitle={subtitle}>
        <Card data-testid="results-hr-toolbar">
          <CardHeader>
            <CardTitle className="text-lg">Рабочий режим HR</CardTitle>
            <CardDescription>
              Фильтры и представление текста привязаны к текущей роли и не обходят privacy rules.
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
                    data-testid={`results-hr-campaign-${campaign.campaignId}`}
                  >
                    <a
                      href={`/results/hr?campaignId=${encodeURIComponent(campaign.campaignId)}${
                        subjectEmployeeId
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
              <div className="flex flex-wrap gap-2" data-testid="results-hr-subject-switcher">
                {subjectOptions.map((subject) => (
                  <Button
                    key={subject.subjectEmployeeId}
                    asChild
                    variant={
                      subject.subjectEmployeeId === subjectEmployeeId ? "secondary" : "outline"
                    }
                    data-testid={`results-hr-subject-${subject.subjectEmployeeId}`}
                  >
                    <a
                      href={`/results/hr?campaignId=${encodeURIComponent(
                        campaignId,
                      )}&subjectEmployeeId=${encodeURIComponent(subject.subjectEmployeeId)}`}
                    >
                      {subject.label}
                    </a>
                  </Button>
                ))}
              </div>
            ) : null}
            {showRawText ? (
              <div className="flex flex-wrap gap-2" data-testid="results-hr-text-toggle">
                <Button
                  asChild
                  variant={normalizedTextView === "combined" ? "secondary" : "outline"}
                >
                  <a
                    href={`/results/hr?campaignId=${encodeURIComponent(
                      campaignId,
                    )}&subjectEmployeeId=${encodeURIComponent(subjectEmployeeId)}&textView=combined`}
                  >
                    Combined
                  </a>
                </Button>
                <Button
                  asChild
                  variant={normalizedTextView === "processed" ? "secondary" : "outline"}
                >
                  <a
                    href={`/results/hr?campaignId=${encodeURIComponent(
                      campaignId,
                    )}&subjectEmployeeId=${encodeURIComponent(subjectEmployeeId)}&textView=processed`}
                  >
                    Processed only
                  </a>
                </Button>
                <Button asChild variant={normalizedTextView === "raw" ? "secondary" : "outline"}>
                  <a
                    href={`/results/hr?campaignId=${encodeURIComponent(
                      campaignId,
                    )}&subjectEmployeeId=${encodeURIComponent(subjectEmployeeId)}&textView=raw`}
                  >
                    Raw only
                  </a>
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
        <ResultsSummaryCard
          campaignId={view.data.campaignId}
          subjectEmployeeId={view.data.subjectEmployeeId}
          campaignLabel={
            campaignOptions.find((item) => item.campaignId === view.data.campaignId)?.label
          }
          subjectLabel={
            subjectOptions.find((item) => item.subjectEmployeeId === view.data.subjectEmployeeId)
              ?.label
          }
          overallScore={view.data.overallScore}
          modelKind={view.data.modelKind}
          anonymityThreshold={view.data.anonymityThreshold}
          openTextCount={view.data.openText?.length ?? 0}
          viewerLabel={showRawText ? "HR Admin workbench" : "HR Reader workbench"}
        />
        <ResultsGroupCard data={view.data} />
        <ResultsCompetenciesCard data={view.data} />
        <ResultsOpenTextCard
          items={view.data.openText}
          showRawText={showRawText}
          textView={showRawText ? normalizedTextView : "processed"}
        />
      </ResultsPageLayout>
    </InternalAppShell>
  );
}
