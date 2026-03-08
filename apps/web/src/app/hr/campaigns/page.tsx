import { InternalAppShell } from "@/components/internal-app-shell";
import { PageEmptyState, PageErrorState, PageStateScreen } from "@/components/page-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { applyDebugPageDelay } from "@/lib/debug-page-delay";
import {
  campaignStatusLabels,
  campaignStatusOrder,
  formatCampaignDateTimeLabel,
  getCampaignStatusCount,
} from "@/lib/hr-campaigns";
import { resolveAppOperationContext } from "@/lib/operation-context";
import { getFriendlyErrorCopy } from "@/lib/page-state";
import { createInprocClient } from "@feedback-360/client";
import { redirect } from "next/navigation";

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
 * HR campaigns catalog screen.
 * @screenId SCR-HR-CAMPAIGNS
 * @testIdScope scr-hr-campaigns
 */
export default async function HrCampaignsPage({
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
        title="HR кампании"
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

  const initialCampaignId = getQueryValue(params.campaignId);
  if (initialCampaignId) {
    redirect(`/hr/campaigns/${initialCampaignId}`);
  }

  const activeStatus = getQueryValue(params.status);
  const client = createInprocClient();
  const campaigns = await client.campaignList({}, resolved.context);
  if (!campaigns.ok) {
    const state = getFriendlyErrorCopy(campaigns.error, {
      title: "Не удалось загрузить кампании",
      description: "Список кампаний временно недоступен. Попробуйте обновить страницу позже.",
    });

    return (
      <PageStateScreen maxWidthClassName="max-w-5xl">
        <PageErrorState
          title={state.title}
          description={state.description}
          actions={[{ href: "/", label: "Вернуться на главную", variant: "outline" }]}
        />
      </PageStateScreen>
    );
  }

  const filteredItems = activeStatus
    ? campaigns.data.items.filter((item) => item.status === activeStatus)
    : campaigns.data.items;

  return (
    <InternalAppShell
      context={resolved.context}
      currentPath="/hr/campaigns"
      title="HR кампании"
      subtitle="Campaign portfolio: список, статусы, быстрый переход в detail dashboard и создание новых draft."
    >
      <div className="space-y-4" data-testid="scr-hr-campaigns-root">
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_320px]">
          <Card className="overflow-hidden rounded-[2rem] border-0 bg-[#2563eb] text-white shadow-[0_20px_50px_-24px_rgba(37,99,235,0.9)]">
            <CardContent className="relative p-8 md:p-10">
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center rounded-full bg-white/12 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-white/80">
                  Campaign Portfolio
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                    Рабочий стол кампаний должен показывать цикл оценки целиком
                  </h2>
                  <p className="max-w-xl text-sm leading-6 text-white/80 md:text-base">
                    Сначала активные кампании и стадии lifecycle, потом quick actions и detail
                    dashboards. Экран помогает быстро понять, что уже идёт, что заблокировано и где
                    нужен HR.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3" data-testid="scr-hr-campaigns-toolbar">
                  {resolved.context.role === "hr_admin" ? (
                    <Button
                      asChild
                      size="lg"
                      className="rounded-xl bg-white px-5 text-primary shadow-none hover:bg-white/90"
                      data-testid="scr-hr-campaigns-create"
                    >
                      <a href="/hr/campaigns/new">Создать draft</a>
                    </Button>
                  ) : null}
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-xl border-white/20 bg-white/10 px-5 text-white hover:bg-white/15 hover:text-white"
                  >
                    <a href="/results/hr">HR результаты</a>
                  </Button>
                </div>
              </div>
              <div className="absolute right-6 top-6 hidden h-36 w-36 rounded-[2rem] bg-white/10 lg:block" />
              <div className="absolute bottom-6 right-8 hidden h-24 w-24 rounded-[1.5rem] border border-white/10 bg-white/8 lg:block" />
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div
              className="rounded-[1.75rem] border border-border/70 bg-card p-5 shadow-sm"
              data-testid="campaign-count-all"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Все кампании
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {campaigns.data.items.length}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Полный каталог кампаний в active company.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-border/70 bg-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Активные
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {getCampaignStatusCount(campaigns.data.items, "started")}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Кампании, которые сейчас собирают ответы.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-border/70 bg-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Требуют внимания
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {getCampaignStatusCount(campaigns.data.items, "processing_ai") +
                  getCampaignStatusCount(campaigns.data.items, "ai_failed")}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                AI processing и failed кампании, где HR чаще нужен первым.
              </p>
            </div>
          </div>
        </section>

        <Card
          className="rounded-[1.75rem] border-border/70 shadow-sm"
          data-testid="scr-hr-campaigns-filters"
        >
          <CardHeader>
            <CardTitle className="text-xl">Фильтры</CardTitle>
            <CardDescription>
              Сфокусируйтесь на нужном lifecycle status и откройте detail page кампании в один клик.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              asChild
              variant={!activeStatus ? "secondary" : "outline"}
              data-testid="campaign-filter-all"
            >
              <a href="/hr/campaigns" className="rounded-xl">
                Все
              </a>
            </Button>
            {campaignStatusOrder.map((status) => (
              <Button
                asChild
                key={status}
                variant={activeStatus === status ? "secondary" : "outline"}
                className="rounded-xl"
                data-testid={`campaign-filter-${status}`}
              >
                <a href={`/hr/campaigns?status=${status}`}>
                  {campaignStatusLabels[status]} (
                  {getCampaignStatusCount(campaigns.data.items, status)})
                </a>
              </Button>
            ))}
          </CardContent>
        </Card>

        {filteredItems.length === 0 ? (
          <PageEmptyState
            title={activeStatus ? "Нет кампаний с таким статусом" : "Пока нет кампаний"}
            description={
              activeStatus
                ? "Снимите фильтр или создайте новую draft campaign."
                : "Создайте первую campaign draft, затем откройте её detail dashboard."
            }
            actions={
              resolved.context.role === "hr_admin"
                ? [{ href: "/hr/campaigns/new", label: "Создать draft", variant: "outline" }]
                : [{ href: "/results/hr", label: "Открыть HR результаты", variant: "outline" }]
            }
            testId="campaign-list-empty"
          />
        ) : (
          <div className="grid gap-4">
            {filteredItems.map((campaign) => (
              <Card
                key={campaign.campaignId}
                className="rounded-[1.75rem] border-border/70 shadow-sm"
                data-testid={`campaign-list-row-${campaign.campaignId}`}
              >
                <CardHeader className="space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <CardDescription>
                        {campaignStatusLabels[campaign.status] ?? campaign.status} ·{" "}
                        {campaign.timezone}
                      </CardDescription>
                    </div>
                    <div
                      className="rounded-full border border-border/70 bg-muted/20 px-3 py-1 text-sm"
                      data-testid={`campaign-row-status-${campaign.campaignId}`}
                    >
                      {campaignStatusLabels[campaign.status] ?? campaign.status}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                  <div className="grid gap-3 text-sm md:grid-cols-3">
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Модель
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {campaign.modelName
                          ? `${campaign.modelName} · v${campaign.modelVersion ?? "?"}`
                          : "Не выбрана"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Start
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {formatCampaignDateTimeLabel(campaign.startAt)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        End
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {formatCampaignDateTimeLabel(campaign.endAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" className="rounded-xl">
                      <a href={`/hr/campaigns/${campaign.campaignId}`}>Открыть detail</a>
                    </Button>
                    {resolved.context.role === "hr_admin" && campaign.status === "draft" ? (
                      <Button
                        asChild
                        className="rounded-xl"
                        data-testid={`campaign-edit-${campaign.campaignId}`}
                      >
                        <a href={`/hr/campaigns/${campaign.campaignId}/edit`}>
                          Редактировать draft
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </InternalAppShell>
  );
}
