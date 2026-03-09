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

/**
 * HR campaign detail screen.
 * @docs .memory-bank/spec/ui/screens/hr-campaign-detail.md
 * @see .memory-bank/spec/ui/screen-registry.md
 * @screenId SCR-HR-CAMPAIGN-DETAIL
 * @testIdScope scr-hr-campaign-detail
 */
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
      <div className="space-y-4" data-testid="scr-hr-campaign-detail-root">
        {flash ? (
          <InlineBanner
            description={flash.description}
            tone={flash.tone}
            testId="campaign-detail-flash"
          />
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_320px]">
          <Card
            className="overflow-hidden rounded-[2rem] border-0 bg-[#2563eb] text-white shadow-[0_20px_50px_-24px_rgba(37,99,235,0.9)]"
            data-testid="campaign-detail-overview"
          >
            <CardContent className="relative p-8 md:p-10">
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center rounded-full bg-white/12 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-white/80">
                  Campaign Detail
                </div>
                <div className="space-y-3">
                  <h2
                    className="text-3xl font-semibold tracking-tight md:text-4xl"
                    data-testid="campaign-detail-name"
                  >
                    {campaign.data.name}
                  </h2>
                  <p className="max-w-xl text-sm leading-6 text-white/80 md:text-base">
                    {getCampaignActionHint(campaign.data)}
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[1.25rem] border border-white/10 bg-white/8 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                      Status
                    </p>
                    <p className="mt-2 text-lg font-semibold" data-testid="campaign-detail-status">
                      {campaignStatusLabels[campaign.data.status] ?? campaign.data.status}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] border border-white/10 bg-white/8 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                      Model
                    </p>
                    <p className="mt-2 text-lg font-semibold" data-testid="campaign-detail-model">
                      {campaign.data.modelName
                        ? `${campaign.data.modelName} · v${campaign.data.modelVersion ?? "?"}`
                        : "Не выбрана"}
                    </p>
                    <p className="text-sm text-white/70">
                      {campaign.data.modelKind ?? "kind unknown"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute right-6 top-6 hidden h-36 w-36 rounded-[2rem] bg-white/10 lg:block" />
              <div className="absolute bottom-6 right-8 hidden h-24 w-24 rounded-[1.5rem] border border-white/10 bg-white/8 lg:block" />
            </CardContent>
          </Card>

          <Card
            className="rounded-[1.75rem] border-border/70 shadow-sm"
            data-testid="campaign-detail-actions"
          >
            <CardHeader>
              <CardTitle className="text-2xl font-semibold tracking-tight">Quick actions</CardTitle>
              <CardDescription>
                HR detail page остаётся источником daily operations без дублирования domain rules.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {canEditCampaignDraft(campaign.data) && resolved.context.role === "hr_admin" ? (
                  <Button asChild className="rounded-xl" data-testid="campaign-detail-edit-draft">
                    <a href={`/hr/campaigns/${campaignId}/edit`}>Редактировать draft</a>
                  </Button>
                ) : null}
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl"
                  data-testid="campaign-detail-open-matrix"
                >
                  <a href={`/hr/campaigns/${campaignId}/matrix`}>Открыть матрицу</a>
                </Button>
                <Button asChild variant="outline" className="rounded-xl">
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
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-[1.75rem] border border-border/70 bg-card p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Questionnaires
            </p>
            <p
              className="mt-3 text-3xl font-semibold tracking-tight"
              data-testid="campaign-detail-progress-total"
            >
              {progressData?.totalQuestionnaires ?? "—"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Общее количество назначенных анкет.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-border/70 bg-card p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Pending
            </p>
            <p
              className="mt-3 text-3xl font-semibold tracking-tight"
              data-testid="campaign-detail-progress-pending"
            >
              {pendingCount ?? "—"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Не начатые и незавершённые анкеты.</p>
          </div>
          <div className="rounded-[1.75rem] border border-border/70 bg-card p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Start
            </p>
            <p className="mt-3 text-base font-semibold">
              {formatCampaignDateTimeLabel(campaign.data.startAt)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{campaign.data.timezone}</p>
          </div>
          <div className="rounded-[1.75rem] border border-border/70 bg-card p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              End
            </p>
            <p className="mt-3 text-base font-semibold">
              {formatCampaignDateTimeLabel(campaign.data.endAt)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Read-only после дедлайна.</p>
          </div>
          <div className="rounded-[1.75rem] border border-border/70 bg-card p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Lock state
            </p>
            <p className="mt-3 text-base font-semibold" data-testid="campaign-detail-progress-lock">
              {progressData?.campaignLockedAt
                ? formatCampaignDateTimeLabel(progressData.campaignLockedAt)
                : "not_locked"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Freeze после первого draft save.</p>
          </div>
        </div>

        <HrCampaignWorkbench
          role={resolved.context.role}
          initialCampaignId={campaignId}
          showCreateSection={false}
        />
      </div>
    </InternalAppShell>
  );
}
