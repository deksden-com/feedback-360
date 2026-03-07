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
        <div className="flex flex-wrap gap-2" data-testid="scr-hr-campaigns-toolbar">
          <Button asChild variant="outline">
            <a href="/results/hr">HR результаты</a>
          </Button>
          {resolved.context.role === "hr_admin" ? (
            <Button asChild data-testid="scr-hr-campaigns-create">
              <a href="/hr/campaigns/new">Создать draft</a>
            </Button>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card data-testid="campaign-count-all">
            <CardHeader>
              <CardTitle className="text-base">Все кампании</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">
              {campaigns.data.items.length}
            </CardContent>
          </Card>
          {campaignStatusOrder.map((status) => (
            <Card key={status} data-testid={`campaign-count-${status}`}>
              <CardHeader>
                <CardTitle className="text-base">{campaignStatusLabels[status]}</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">
                {getCampaignStatusCount(campaigns.data.items, status)}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card data-testid="scr-hr-campaigns-filters">
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
              <a href="/hr/campaigns">Все</a>
            </Button>
            {campaignStatusOrder.map((status) => (
              <Button
                asChild
                key={status}
                variant={activeStatus === status ? "secondary" : "outline"}
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
                      className="rounded-full border px-3 py-1 text-sm"
                      data-testid={`campaign-row-status-${campaign.campaignId}`}
                    >
                      {campaignStatusLabels[campaign.status] ?? campaign.status}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                  <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                    <p>
                      Модель:{" "}
                      <span className="font-medium text-foreground">
                        {campaign.modelName
                          ? `${campaign.modelName} · v${campaign.modelVersion ?? "?"}`
                          : "Не выбрана"}
                      </span>
                    </p>
                    <p>
                      Start:{" "}
                      <span className="font-medium text-foreground">
                        {formatCampaignDateTimeLabel(campaign.startAt)}
                      </span>
                    </p>
                    <p>
                      End:{" "}
                      <span className="font-medium text-foreground">
                        {formatCampaignDateTimeLabel(campaign.endAt)}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                      <a href={`/hr/campaigns/${campaign.campaignId}`}>Открыть detail</a>
                    </Button>
                    {resolved.context.role === "hr_admin" && campaign.status === "draft" ? (
                      <Button asChild data-testid={`campaign-edit-${campaign.campaignId}`}>
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
