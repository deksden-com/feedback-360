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
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FolderKanban,
  Sparkles,
} from "lucide-react";
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

const sectionMeta: Record<
  (typeof statusOrder)[number],
  { title: string; description: string; icon: typeof ClipboardCheck; tone: string }
> = {
  in_progress: {
    title: "Черновики",
    description: "Сначала завершите уже начатые формы — это самый короткий путь к отправке.",
    icon: ClipboardCheck,
    tone: "border-primary/15 bg-primary/5 text-primary",
  },
  not_started: {
    title: "Новые анкеты",
    description: "Формы, которые ещё ждут первого черновика и первого сохранения.",
    icon: FolderKanban,
    tone: "border-amber-500/15 bg-amber-500/5 text-amber-700 dark:text-amber-300",
  },
  submitted: {
    title: "История отправок",
    description: "Уже отправленные формы остаются здесь как read-only история по кампании.",
    icon: CheckCircle2,
    tone: "border-emerald-500/15 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
  },
};

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

/**
 * Questionnaire inbox screen.
 * @screenId SCR-QUESTIONNAIRES-INBOX
 * @testIdScope scr-questionnaires-inbox
 */
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
      <div className="space-y-4" data-testid="scr-questionnaires-inbox-root">
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

        <section
          className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_320px]"
          data-testid="scr-questionnaires-inbox-summary"
        >
          <Card className="overflow-hidden rounded-[2rem] border-0 bg-[#2563eb] text-white shadow-[0_20px_50px_-24px_rgba(37,99,235,0.9)]">
            <CardContent className="relative p-8 md:p-10">
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center rounded-full bg-white/12 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-white/80">
                  Questionnaire Workspace
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                    Двигайтесь от черновиков к отправке
                  </h2>
                  <p className="max-w-xl text-sm leading-6 text-white/80 md:text-base">
                    Начните с уже открытых анкет, затем вернитесь к новым назначениям. Отправленные
                    формы остаются в inbox как история, но уже без редактирования.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-xl bg-white px-5 text-primary shadow-none hover:bg-white/90"
                  >
                    <a
                      href={
                        filteredItems.find((item) => item.status === "in_progress")
                          ? `/questionnaires/${
                              filteredItems.find((item) => item.status === "in_progress")
                                ?.questionnaireId
                            }`
                          : filteredItems[0]
                            ? `/questionnaires/${filteredItems[0].questionnaireId}`
                            : "/questionnaires"
                      }
                    >
                      {counts.inProgress > 0 ? "Продолжить черновик" : "Открыть следующую анкету"}
                    </a>
                  </Button>
                  <span className="text-sm text-white/75">
                    Все анкеты уже привязаны к активной компании и вашей роли в кампании.
                  </span>
                </div>
              </div>
              <div className="absolute right-6 top-6 hidden h-36 w-36 rounded-[2rem] bg-white/10 lg:block" />
              <div className="absolute bottom-6 right-8 hidden h-24 w-24 rounded-[1.5rem] border border-white/10 bg-white/8 lg:block" />
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <Card
              className="rounded-[1.75rem] border-border/70 shadow-sm"
              data-testid="questionnaire-summary-total"
            >
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Всего назначено
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight">{counts.total}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Все формы, в которых вы участвуете как оценивающий.
                </p>
              </CardContent>
            </Card>
            <Card
              className="rounded-[1.75rem] border-border/70 shadow-sm"
              data-testid="questionnaire-summary-drafts"
            >
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  В работе
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight">{counts.inProgress}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Формы с первым сохранением черновика, к которым стоит вернуться раньше всего.
                </p>
              </CardContent>
            </Card>
            <Card
              className="rounded-[1.75rem] border-border/70 shadow-sm"
              data-testid="questionnaire-summary-submitted"
            >
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Отправлено
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight">{counts.submitted}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Read-only история уже закрытых анкет по текущим кампаниям.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Card
          className="rounded-[1.75rem] border-border/70 shadow-sm"
          data-testid="scr-questionnaires-inbox-toolbar"
        >
          <CardHeader className="space-y-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-semibold tracking-tight">
                Фильтры и быстрый возврат
              </CardTitle>
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
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={cn(
                          "flex size-11 shrink-0 items-center justify-center rounded-2xl border",
                          sectionMeta[statusKey].tone,
                        )}
                      >
                        {(() => {
                          const Icon = sectionMeta[statusKey].icon;
                          return <Icon className="size-5" />;
                        })()}
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-2xl font-semibold tracking-tight">
                          {sectionMeta[statusKey].title} · {items.length}
                        </h2>
                        <p className="max-w-3xl text-sm text-muted-foreground">
                          {sectionMeta[statusKey].description}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-full border border-border/70 bg-muted/20 px-3 py-1 text-sm text-muted-foreground">
                      {questionnaireStatusLabels[statusKey]}
                    </div>
                  </div>
                  <div className="grid gap-4">
                    {items.map((item) => (
                      <Card
                        key={item.questionnaireId}
                        className="rounded-[1.75rem] border-border/70 shadow-sm"
                        data-testid={`questionnaire-row-${item.questionnaireId}`}
                      >
                        <CardHeader className="gap-4 pb-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                                {statusKey === "submitted" ? (
                                  <CheckCircle2 className="size-5" />
                                ) : statusKey === "in_progress" ? (
                                  <Sparkles className="size-5" />
                                ) : (
                                  <BriefcaseBusiness className="size-5" />
                                )}
                              </div>
                              <div className="space-y-1">
                                <CardTitle className="text-xl font-semibold tracking-tight">
                                  {item.subjectDisplayName ?? `Сотрудник ${item.subjectEmployeeId}`}
                                </CardTitle>
                                <CardDescription className="text-sm">
                                  {item.campaignName}
                                  {item.subjectPositionTitle
                                    ? ` · ${item.subjectPositionTitle}`
                                    : ""}
                                </CardDescription>
                              </div>
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
                        <CardContent className="space-y-5">
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4 text-sm">
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                Роль
                              </p>
                              <p className="mt-2 font-medium text-foreground">
                                {item.raterRole
                                  ? questionnaireRaterRoleLabels[item.raterRole]
                                  : "Оценивающий"}
                              </p>
                            </div>
                            <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4 text-sm">
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                Дедлайн
                              </p>
                              <p className="mt-2 font-medium text-foreground">
                                {formatDate(item.campaignEndAt) ?? "—"}
                              </p>
                            </div>
                            <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4 text-sm">
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                Кампания
                              </p>
                              <p className="mt-2 font-medium text-foreground">
                                {item.campaignStatus
                                  ? campaignStatusLabels[item.campaignStatus]
                                  : campaignStatusLabels.started}
                              </p>
                            </div>
                            <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4 text-sm">
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                Последнее действие
                              </p>
                              <p className="mt-2 font-medium text-foreground">
                                {item.submittedAt
                                  ? `Отправлена ${formatDate(item.submittedAt)}`
                                  : item.firstDraftAt
                                    ? `Черновик ${formatDate(item.firstDraftAt)}`
                                    : "Нет сохранений"}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              asChild
                              className="rounded-xl"
                              data-testid={`open-questionnaire-${item.questionnaireId}`}
                            >
                              <a href={`/questionnaires/${item.questionnaireId}`}>
                                {getQuestionnaireCtaLabel(item.status)}
                                <ArrowRight className="ml-2 size-4" />
                              </a>
                            </Button>
                            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                              <Clock3 className="size-4" />
                              После отправки форма остаётся только для чтения.
                            </div>
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
      </div>
    </InternalAppShell>
  );
}
