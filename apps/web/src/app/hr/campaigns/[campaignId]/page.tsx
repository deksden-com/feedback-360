import { InternalAppShell } from "@/components/internal-app-shell";
import { InlineBanner, PageErrorState, PageStateScreen } from "@/components/page-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { applyDebugPageDelay } from "@/lib/debug-page-delay";
import {
  campaignStatusLabels,
  canEditCampaignDraft,
  canRetryAiForCampaign,
  formatCampaignDateTimeLabel,
  getCampaignActionHint,
} from "@/lib/hr-campaigns";
import { resolveAppOperationContext } from "@/lib/operation-context";
import { getFriendlyErrorCopy } from "@/lib/page-state";
import { createInprocClient } from "@feedback-360/client";
import { redirect } from "next/navigation";

import { HrCampaignWorkbench } from "../_workbench";

const getQueryValue = (value: string | string[] | undefined): string | undefined => {
  if (typeof value === "string") {
    return value.trim().length > 0 ? value.trim() : undefined;
  }
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" && first.trim().length > 0 ? first.trim() : undefined;
  }
  return undefined;
};

export default async function HrCampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ campaignId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ campaignId }, query] = await Promise.all([
    params,
    searchParams ?? Promise.resolve<Record<string, string | string[] | undefined>>({}),
  ]);
  await applyDebugPageDelay(query.debugDelayMs);
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
      title: "Не удалось открыть campaign detail",
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
        title="Campaign detail"
        subtitle="Раздел доступен только для HR Admin и HR Reader."
      >
        <PageErrorState
          title="Недостаточно прав для campaign detail"
          description="Откройте личные или командные результаты, либо переключите активную компанию."
          actions={[{ href: "/", label: "Вернуться на главную", variant: "outline" }]}
        />
      </InternalAppShell>
    );
  }

  const client = createInprocClient();
  const [campaign, progress] = await Promise.all([
    client.campaignGet({ campaignId }, resolved.context),
    client.campaignProgressGet({ campaignId }, resolved.context),
  ]);

  if (!campaign.ok) {
    const state = getFriendlyErrorCopy(campaign.error, {
      title: "Не удалось загрузить кампанию",
      description: "Campaign detail временно недоступен. Попробуйте открыть страницу чуть позже.",
    });

    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/hr/campaigns"
        title="Campaign detail"
        subtitle="Overview, progress и operational controls кампании 360."
      >
        <PageErrorState
          title={state.title}
          description={state.description}
          actions={[{ href: "/hr/campaigns", label: "Вернуться к списку", variant: "outline" }]}
        />
      </InternalAppShell>
    );
  }

  const flash = getQueryValue(query.created)
    ? {
        description: "Draft кампании создан. Теперь можно продолжить настройку или запустить её.",
        tone: "success" as const,
      }
    : getQueryValue(query.saved)
      ? { description: "Draft кампании сохранён.", tone: "success" as const }
      : getQueryValue(query.error)
        ? {
            description:
              getQueryValue(query.error) === "campaign_started_immutable"
                ? "Кампания уже вышла из draft, поэтому базовую конфигурацию больше нельзя менять."
                : "Не удалось выполнить действие. Проверьте состояние кампании и попробуйте снова.",
            tone: "error" as const,
          }
        : undefined;

  const progressData = progress.ok ? progress.data : null;
  const pendingCount = progressData
    ? progressData.statusCounts.notStarted + progressData.statusCounts.inProgress
    : null;

  return (
    <InternalAppShell
      context={resolved.context}
      currentPath="/hr/campaigns"
      title={campaign.data.name}
      subtitle="Detail dashboard: overview, progress, lock state и operational controls в одном месте."
    >
      {flash ? (
        <InlineBanner
          description={flash.description}
          tone={flash.tone}
          testId="campaign-detail-flash"
        />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card data-testid="campaign-detail-overview">
          <CardHeader>
            <CardTitle className="text-xl">Overview</CardTitle>
            <CardDescription>{getCampaignActionHint(campaign.data)}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Кампания</p>
              <p className="text-lg font-semibold" data-testid="campaign-detail-name">
                {campaign.data.name}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-lg font-semibold" data-testid="campaign-detail-status">
                {campaignStatusLabels[campaign.data.status] ?? campaign.data.status}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Model</p>
              <p className="text-lg font-semibold" data-testid="campaign-detail-model">
                {campaign.data.modelName
                  ? `${campaign.data.modelName} · v${campaign.data.modelVersion ?? "?"}`
                  : "Не выбрана"}
              </p>
              <p className="text-sm text-muted-foreground">
                {campaign.data.modelKind ?? "kind unknown"}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Сроки</p>
              <p className="font-medium">
                {formatCampaignDateTimeLabel(campaign.data.startAt)} →{" "}
                {formatCampaignDateTimeLabel(campaign.data.endAt)}
              </p>
              <p className="text-sm text-muted-foreground">{campaign.data.timezone}</p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Веса</p>
              <p className="font-medium">
                M {campaign.data.managerWeight}% · P {campaign.data.peersWeight}% · S{" "}
                {campaign.data.subordinatesWeight}%
              </p>
              <p className="text-sm text-muted-foreground">Self {campaign.data.selfWeight}%</p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="campaign-detail-actions">
          <CardHeader>
            <CardTitle className="text-xl">Quick actions</CardTitle>
            <CardDescription>
              HR detail page остаётся источником daily operations без дублирования domain rules.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {canEditCampaignDraft(campaign.data) && resolved.context.role === "hr_admin" ? (
                <Button asChild data-testid="campaign-detail-edit-draft">
                  <a href={`/hr/campaigns/${campaignId}/edit`}>Редактировать draft</a>
                </Button>
              ) : null}
              <Button asChild variant="outline" data-testid="campaign-detail-open-matrix">
                <a href={`/hr/campaigns/${campaignId}/matrix`}>Открыть матрицу</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/hr/campaigns">К списку кампаний</a>
              </Button>
            </div>

            {campaign.data.lockedAt ? (
              <InlineBanner
                description={`Кампания зафиксирована: ${formatCampaignDateTimeLabel(campaign.data.lockedAt)}. Матрица и веса больше не меняются.`}
                tone="warning"
                testId="campaign-detail-lock-banner"
              />
            ) : (
              <InlineBanner
                description="Матрица и веса можно менять, пока в любой анкете не появился первый draft save."
                tone="default"
                testId="campaign-detail-unlocked-banner"
              />
            )}

            <div className="rounded-lg border bg-muted/20 p-4 text-sm">
              <p className="font-medium">AI post-processing</p>
              <p className="text-muted-foreground">
                {canRetryAiForCampaign(campaign.data)
                  ? "После ended или ai_failed можно повторно запустить AI job."
                  : "AI retry появится, когда кампания перейдёт в ended/ai_failed."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="campaign-detail-progress-total">
          <CardHeader>
            <CardTitle className="text-base">Questionnaires</CardTitle>
            <CardDescription>Общее количество назначенных анкет.</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {progressData?.totalQuestionnaires ?? "—"}
          </CardContent>
        </Card>
        <Card data-testid="campaign-detail-progress-pending">
          <CardHeader>
            <CardTitle className="text-base">Pending</CardTitle>
            <CardDescription>Не начатые и незавершённые анкеты.</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{pendingCount ?? "—"}</CardContent>
        </Card>
        <Card data-testid="campaign-detail-progress-lock">
          <CardHeader>
            <CardTitle className="text-base">Lock state</CardTitle>
            <CardDescription>Freeze-правило после первого draft save.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm font-medium">
            {progressData?.campaignLockedAt
              ? formatCampaignDateTimeLabel(progressData.campaignLockedAt)
              : "not_locked"}
          </CardContent>
        </Card>
      </div>

      <HrCampaignWorkbench
        role={resolved.context.role}
        initialCampaignId={campaignId}
        showCreateSection={false}
      />
    </InternalAppShell>
  );
}
