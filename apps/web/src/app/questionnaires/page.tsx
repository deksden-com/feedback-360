import { InternalAppShell } from "@/components/internal-app-shell";
import {
  InlineBanner,
  PageEmptyState,
  PageErrorState,
  PageStateScreen,
} from "@/components/page-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { applyDebugPageDelay } from "@/lib/debug-page-delay";
import { resolveAppOperationContext } from "@/lib/operation-context";
import { getFriendlyErrorCopy } from "@/lib/page-state";
import {
  campaignStatusLabels,
  getQuestionnaireCounts,
  getQuestionnaireCtaLabel,
  getQuestionnaireStatusTone,
  groupQuestionnairesByStatus,
  questionnaireRaterRoleLabels,
  questionnaireStatusLabels,
} from "@/lib/questionnaire-ui";
import { cn } from "@/lib/utils";
import { createInprocClient } from "@feedback-360/client";
import { redirect } from "next/navigation";

const getQueryValue = (value: string | string[] | undefined): string | undefined => {
  if (typeof value === "string") {
    return value;
  }
  return value?.[0];
};

const errorLabels: Record<string, string> = {
  campaign_ended_readonly: "Кампания завершена. Анкета доступна только для чтения.",
  invalid_transition: "Невозможно выполнить действие в текущем состоянии анкеты.",
  forbidden: "Недостаточно прав для выполнения действия.",
};

const statusOrder = ["in_progress", "not_started", "submitted"] as const;

const formatDate = (value?: string) => {
  if (!value) {
    return undefined;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const buildFilterHref = (
  currentParams: Record<string, string | string[] | undefined> | undefined,
  next: Record<string, string | undefined>,
) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(currentParams ?? {})) {
    const normalized = getQueryValue(value);
    if (normalized) {
      params.set(key, normalized);
    }
  }

  for (const [key, value] of Object.entries(next)) {
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
  }

  const query = params.toString();
  return query.length > 0 ? `/questionnaires?${query}` : "/questionnaires";
};

export default async function QuestionnairesPage({
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
      title: "Не удалось загрузить анкеты",
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

  const saved = getQueryValue(params?.saved) === "1";
  const submitted = getQueryValue(params?.submitted) === "1";
  const errorCode = getQueryValue(params?.error);
  const selectedStatus = getQueryValue(params?.status);
  const selectedCampaignId = getQueryValue(params?.campaignId);

  const client = createInprocClient();
  const questionnaires = await client.questionnaireListAssigned({}, resolved.context);
  if (!questionnaires.ok) {
    const state = getFriendlyErrorCopy(questionnaires.error, {
      title: "Не удалось загрузить анкеты",
      description: "Список анкет временно недоступен. Попробуйте обновить страницу чуть позже.",
    });

    return (
      <PageStateScreen maxWidthClassName="max-w-4xl">
        <PageErrorState
          title={state.title}
          description={state.description}
          actions={[{ href: "/", label: "Вернуться на главную", variant: "outline" }]}
        />
      </PageStateScreen>
    );
  }

  const allItems = questionnaires.data.items;
  const counts = getQuestionnaireCounts(allItems);
  const campaignOptions = Array.from(
    new Map(
      allItems.map((item) => [
        item.campaignId,
        {
          campaignId: item.campaignId,
          label: item.campaignName ?? item.campaignId,
        },
      ]),
    ).values(),
  ).sort((left, right) => left.label.localeCompare(right.label));

  const filteredItems = allItems.filter((item) => {
    if (selectedStatus && item.status !== selectedStatus) {
      return false;
    }

    if (selectedCampaignId && item.campaignId !== selectedCampaignId) {
      return false;
    }

    return true;
  });
  const groupedItems = groupQuestionnairesByStatus(filteredItems);

  return (
    <InternalAppShell
      context={resolved.context}
      currentPath="/questionnaires"
      title="Мои анкеты"
      subtitle="Вернитесь к черновикам, завершите оценки по компетенциям и отслеживайте, что уже отправлено."
    >
      {saved ? (
        <InlineBanner
          description="Черновик сохранён. Можно продолжить позже или сразу отправить анкету."
          tone="success"
          testId="flash-saved"
        />
      ) : null}
      {submitted ? (
        <InlineBanner
          description="Анкета отправлена и переведена в read-only."
          tone="success"
          testId="flash-submitted"
        />
      ) : null}
      {errorCode ? (
        <InlineBanner
          description={
            errorLabels[errorCode] ??
            "Не удалось выполнить действие. Обновите страницу и попробуйте снова."
          }
          tone="error"
          testId="flash-error"
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="questionnaire-summary-total">
          <CardHeader className="space-y-1">
            <CardDescription>Всего назначено</CardDescription>
            <CardTitle className="text-3xl">{counts.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card data-testid="questionnaire-summary-drafts">
          <CardHeader className="space-y-1">
            <CardDescription>В работе</CardDescription>
            <CardTitle className="text-3xl">{counts.inProgress}</CardTitle>
          </CardHeader>
        </Card>
        <Card data-testid="questionnaire-summary-submitted">
          <CardHeader className="space-y-1">
            <CardDescription>Отправлено</CardDescription>
            <CardTitle className="text-3xl">{counts.submitted}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="space-y-1">
            <CardTitle className="text-xl">Фильтры и быстрый возврат</CardTitle>
            <CardDescription>
              Сфокусируйтесь на черновиках или конкретной кампании, не теряя контекст активной
              компании.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              variant={!selectedStatus ? "secondary" : "outline"}
              data-testid="questionnaire-filter-status-all"
            >
              <a href={buildFilterHref(params, { status: undefined })}>Все</a>
            </Button>
            <Button
              asChild
              variant={selectedStatus === "in_progress" ? "secondary" : "outline"}
              data-testid="questionnaire-filter-status-in_progress"
            >
              <a href={buildFilterHref(params, { status: "in_progress" })}>Черновики</a>
            </Button>
            <Button
              asChild
              variant={selectedStatus === "not_started" ? "secondary" : "outline"}
              data-testid="questionnaire-filter-status-not_started"
            >
              <a href={buildFilterHref(params, { status: "not_started" })}>Не начаты</a>
            </Button>
            <Button
              asChild
              variant={selectedStatus === "submitted" ? "secondary" : "outline"}
              data-testid="questionnaire-filter-status-submitted"
            >
              <a href={buildFilterHref(params, { status: "submitted" })}>Отправлены</a>
            </Button>
          </div>
          {campaignOptions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                variant={!selectedCampaignId ? "secondary" : "outline"}
                data-testid="questionnaire-filter-campaign-all"
              >
                <a href={buildFilterHref(params, { campaignId: undefined })}>Все кампании</a>
              </Button>
              {campaignOptions.map((campaign) => (
                <Button
                  key={campaign.campaignId}
                  asChild
                  variant={selectedCampaignId === campaign.campaignId ? "secondary" : "outline"}
                  data-testid={`questionnaire-filter-campaign-${campaign.campaignId}`}
                >
                  <a href={buildFilterHref(params, { campaignId: campaign.campaignId })}>
                    {campaign.label}
                  </a>
                </Button>
              ))}
            </div>
          ) : null}
        </CardHeader>
      </Card>

      {allItems.length === 0 ? (
        <PageEmptyState
          title="Нет назначенных анкет"
          description="Когда вас добавят в матрицу оценивания, анкеты появятся в этом списке."
          actions={[{ href: "/", label: "Перейти на главную", variant: "outline" }]}
          testId="questionnaire-empty"
        />
      ) : filteredItems.length === 0 ? (
        <PageEmptyState
          title="По текущим фильтрам ничего не найдено"
          description="Сбросьте фильтры и посмотрите полный inbox, чтобы вернуться к активным задачам."
          actions={[
            {
              href: "/questionnaires",
              label: "Сбросить фильтры",
              variant: "outline",
            },
          ]}
          testId="questionnaire-empty-filtered"
        />
      ) : (
        <div className="space-y-6">
          {statusOrder.map((statusKey) => {
            const items = groupedItems[statusKey];
            if (items.length === 0) {
              return null;
            }

            return (
              <section
                key={statusKey}
                className="space-y-3"
                data-testid={`questionnaire-section-${statusKey}`}
              >
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">
                    {questionnaireStatusLabels[statusKey]} · {items.length}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {statusKey === "in_progress"
                      ? "Сначала вернитесь к уже начатым анкетам — это самый короткий путь к завершению."
                      : statusKey === "not_started"
                        ? "Новые анкеты, которые ещё ждут первого черновика."
                        : "Уже отправленные анкеты доступны только для просмотра."}
                  </p>
                </div>
                <div className="grid gap-4">
                  {items.map((item) => (
                    <Card
                      key={item.questionnaireId}
                      data-testid={`questionnaire-row-${item.questionnaireId}`}
                    >
                      <CardHeader className="gap-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">
                              {item.subjectDisplayName ?? `Сотрудник ${item.subjectEmployeeId}`}
                            </CardTitle>
                            <CardDescription>
                              {item.campaignName}
                              {item.subjectPositionTitle ? ` · ${item.subjectPositionTitle}` : ""}
                            </CardDescription>
                          </div>
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-3 py-1 text-xs font-medium",
                              getQuestionnaireStatusTone(item.status),
                            )}
                            data-testid={`questionnaire-status-${item.questionnaireId}`}
                          >
                            {questionnaireStatusLabels[item.status]}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                          <p>
                            Роль:{" "}
                            <span className="font-medium text-foreground">
                              {item.raterRole
                                ? questionnaireRaterRoleLabels[item.raterRole]
                                : "Оценивающий"}
                            </span>
                          </p>
                          <p>
                            Дедлайн:{" "}
                            <span className="font-medium text-foreground">
                              {formatDate(item.campaignEndAt) ?? "—"}
                            </span>
                          </p>
                          <p>
                            Состояние кампании:{" "}
                            <span className="font-medium text-foreground">
                              {item.campaignStatus
                                ? campaignStatusLabels[item.campaignStatus]
                                : campaignStatusLabels.started}
                            </span>
                          </p>
                          <p>
                            {item.submittedAt
                              ? `Отправлена ${formatDate(item.submittedAt)}`
                              : item.firstDraftAt
                                ? `Черновик сохранён ${formatDate(item.firstDraftAt)}`
                                : "Черновик ещё не сохранялся"}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            asChild
                            data-testid={`open-questionnaire-${item.questionnaireId}`}
                          >
                            <a href={`/questionnaires/${item.questionnaireId}`}>
                              {getQuestionnaireCtaLabel(item.status)}
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </InternalAppShell>
  );
}
