import { InternalAppShell } from "@/components/internal-app-shell";
import { InlineBanner, PageErrorState, PageStateScreen } from "@/components/page-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { applyDebugPageDelay } from "@/lib/debug-page-delay";
import { resolveAppOperationContext } from "@/lib/operation-context";
import { getFriendlyErrorCopy } from "@/lib/page-state";
import {
  campaignStatusLabels,
  getQuestionnaireProgress,
  normalizeQuestionnaireDraft,
  questionnaireRaterRoleLabels,
  questionnaireStatusLabels,
} from "@/lib/questionnaire-ui";
import { cn } from "@/lib/utils";
import { createInprocClient } from "@feedback-360/client";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  CheckCircle2,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  MessageSquareText,
  Target,
} from "lucide-react";
import { redirect } from "next/navigation";

const indicatorScale = [
  { value: "1", label: "1", caption: "Нужно улучшение" },
  { value: "2", label: "2", caption: "Ниже ожиданий" },
  { value: "3", label: "3", caption: "Соответствует ожиданиям" },
  { value: "4", label: "4", caption: "Выше ожиданий" },
  { value: "5", label: "5", caption: "Сильное проявление" },
  { value: "NA", label: "N/A", caption: "Не могу оценить" },
] as const;

const levelScale = [
  { value: "1", label: "1", caption: "Уровень 1" },
  { value: "2", label: "2", caption: "Уровень 2" },
  { value: "3", label: "3", caption: "Уровень 3" },
  { value: "4", label: "4", caption: "Уровень 4" },
  { value: "UNSURE", label: "?", caption: "Затрудняюсь ответить" },
] as const;

const getQueryValue = (value: string | string[] | undefined): string | undefined => {
  if (typeof value === "string") {
    return value;
  }
  return value?.[0];
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

const getReadonlyReason = (status: string, campaignStatus: string) => {
  if (status === "submitted") {
    return "Анкета уже отправлена и доступна только для чтения.";
  }

  if (campaignStatus === "ended") {
    return "Кампания завершена. Черновик сохранён для истории, но редактирование закрыто.";
  }

  if (campaignStatus === "processing_ai" || campaignStatus === "completed") {
    return "Кампания уже перешла к обработке результатов, поэтому анкета read-only.";
  }

  if (campaignStatus === "ai_failed") {
    return "Кампания закрыта и ждёт повторной AI-обработки. Анкеты больше не редактируются.";
  }

  return "Анкета доступна только для чтения.";
};

const errorLabels: Record<string, string> = {
  campaign_ended_readonly: "Кампания завершена. Черновик больше нельзя изменить.",
  invalid_transition: "В текущем состоянии анкеты это действие недоступно.",
  forbidden: "Недостаточно прав, чтобы открыть или изменить эту анкету.",
};

const isReadonlyState = (status: string, campaignStatus: string): boolean => {
  if (status === "submitted") {
    return true;
  }

  return (
    campaignStatus === "ended" ||
    campaignStatus === "processing_ai" ||
    campaignStatus === "ai_failed" ||
    campaignStatus === "completed"
  );
};

const formatDeadlineDistance = (value?: string) => {
  if (!value) {
    return "Дедлайн не указан";
  }

  const target = new Date(value).getTime();
  const diff = target - Date.now();
  if (diff <= 0) {
    return "Дедлайн наступил";
  }

  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  if (days > 0) {
    return `Осталось ${days} дн.`;
  }

  const hours = Math.max(totalHours, 1);
  return `Осталось ${hours} ч.`;
};

const getProgressPercent = (answeredPrompts: number, totalPrompts: number) => {
  if (totalPrompts <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((answeredPrompts / totalPrompts) * 100));
};

/**
 * Questionnaire fill/read-only screen.
 * @screenId SCR-QUESTIONNAIRES-FILL
 * @testIdScope scr-questionnaires-fill
 */
export default async function QuestionnaireDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ questionnaireId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
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
      title: "Не удалось открыть анкету",
      description: "Попробуйте обновить страницу или вернуться к списку анкет.",
    });

    return (
      <PageStateScreen>
        <PageErrorState
          title={state.title}
          description={state.description}
          actions={[{ href: "/questionnaires", label: "К списку анкет", variant: "outline" }]}
        />
      </PageStateScreen>
    );
  }

  const routeParams = await params;
  const query = searchParams ? await searchParams : undefined;
  await applyDebugPageDelay(query?.debugDelayMs);
  const saved = getQueryValue(query?.saved) === "1";
  const submitted = getQueryValue(query?.submitted) === "1";
  const errorCode = getQueryValue(query?.error);

  const client = createInprocClient();
  const questionnaire = await client.questionnaireGetDraft(
    {
      questionnaireId: routeParams.questionnaireId,
    },
    resolved.context,
  );

  if (!questionnaire.ok) {
    const state = getFriendlyErrorCopy(questionnaire.error, {
      title: "Не удалось открыть анкету",
      description: "Анкета недоступна, была удалена или не относится к вашей активной компании.",
    });

    return (
      <PageStateScreen>
        <PageErrorState
          title={state.title}
          description={state.description}
          actions={[{ href: "/questionnaires", label: "К списку анкет", variant: "outline" }]}
        />
      </PageStateScreen>
    );
  }

  const data = questionnaire.data;
  const readonly = isReadonlyState(data.status, data.campaignStatus);
  const normalizedDraft = normalizeQuestionnaireDraft(data.draft);
  const progress = getQuestionnaireProgress(data.definition, normalizedDraft);
  const progressPercent = getProgressPercent(progress.answeredPrompts, progress.totalPrompts);

  return (
    <InternalAppShell
      context={resolved.context}
      currentPath="/questionnaires"
      title={data.subjectDisplayName ?? `Анкета ${data.questionnaireId}`}
      subtitle={`${data.campaignName} · ${
        questionnaireStatusLabels[data.status] ?? data.status
      } · ${campaignStatusLabels[data.campaignStatus] ?? data.campaignStatus}`}
    >
      <div className="space-y-6" data-testid="scr-questionnaires-fill-root">
        {saved ? (
          <InlineBanner
            description="Черновик сохранён. Можно вернуться к нему в любой момент до завершения кампании."
            tone="success"
            testId="questionnaire-flash-saved"
          />
        ) : null}
        {submitted ? (
          <InlineBanner
            description="Анкета отправлена. Теперь она доступна только для просмотра."
            tone="success"
            testId="questionnaire-flash-submitted"
          />
        ) : null}
        {errorCode ? (
          <InlineBanner
            description={
              errorLabels[errorCode] ??
              "Не удалось выполнить действие. Обновите страницу и попробуйте снова."
            }
            tone="error"
            testId="questionnaire-flash-error"
          />
        ) : null}
        {readonly ? (
          <InlineBanner
            description={getReadonlyReason(data.status, data.campaignStatus)}
            tone="warning"
            testId="readonly-banner"
          />
        ) : null}

        <section
          className="space-y-4 rounded-[2rem] border border-border/70 bg-card p-5 shadow-sm md:p-6"
          data-testid="scr-questionnaires-fill-summary"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1">
                  <BriefcaseBusiness className="size-4" />
                  {data.subjectPositionTitle ?? "Сотрудник"}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1">
                  <ClipboardCheck className="size-4" />
                  {data.raterRole ? questionnaireRaterRoleLabels[data.raterRole] : "Оценивающий"}
                </span>
              </div>
              <div className="space-y-1">
                <CardTitle className="text-3xl font-semibold tracking-tight">
                  {data.subjectDisplayName ?? `Сотрудник ${data.subjectEmployeeId}`}
                </CardTitle>
                <CardDescription className="text-base">{data.campaignName}</CardDescription>
              </div>
            </div>
            <div className="grid min-w-[220px] gap-2 text-sm">
              <div className="inline-flex items-center justify-between rounded-2xl border border-border/70 bg-muted/25 px-4 py-3">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <Clock3 className="size-4" />
                  {formatDeadlineDistance(data.campaignEndAt)}
                </span>
                <span className="font-medium text-foreground">
                  {formatDate(data.campaignEndAt)}
                </span>
              </div>
              <div className="inline-flex items-center justify-between rounded-2xl border border-border/70 bg-muted/25 px-4 py-3">
                <span className="text-muted-foreground">Статус</span>
                <span className="font-medium text-foreground">
                  {questionnaireStatusLabels[data.status]}
                </span>
              </div>
            </div>
          </div>

          <Card
            className="rounded-[1.5rem] border border-border/70 bg-muted/15 shadow-none"
            data-testid="questionnaire-progress-card"
          >
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Прогресс заполнения</p>
                  <p
                    className="text-2xl font-semibold tracking-tight"
                    data-testid="questionnaire-progress"
                  >
                    {progress.answeredPrompts}/{progress.totalPrompts}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1">
                    <Target className="size-4" />
                    Компетенции: {progress.completedCompetencies}/{progress.totalCompetencies}
                  </span>
                  {data.submittedAt ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="size-4" />
                      Отправлена {formatDate(data.submittedAt)}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>
                  {data.firstDraftAt
                    ? `Первый черновик сохранён ${formatDate(data.firstDraftAt)}`
                    : "Черновик ещё не сохранялся."}
                </span>
                <span>Кампания: {campaignStatusLabels[data.campaignStatus]}</span>
              </div>
            </CardContent>
          </Card>
        </section>

        <form method="post" className="space-y-6" data-testid="scr-questionnaires-fill-form">
          <input type="hidden" name="questionnaireId" value={data.questionnaireId} />

          {data.definition ? (
            data.definition.groups.map((group) => (
              <Card
                key={group.groupId}
                className="overflow-hidden rounded-[2rem] border-border/70 shadow-sm"
              >
                <CardHeader className="space-y-2 border-b bg-muted/20 pb-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-2xl font-semibold tracking-tight">
                        {group.name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Вес группы: {group.weight}% · Компетенций: {group.competencies.length}
                      </CardDescription>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-sm text-muted-foreground">
                      <CircleHelp className="size-4" />
                      {data.definition?.modelKind === "indicators"
                        ? "Оцените каждый индикатор"
                        : "Выберите один уровень"}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 p-5 md:p-6">
                  {group.competencies.map((competency) => (
                    <section
                      key={competency.competencyId}
                      className="space-y-5 rounded-[1.75rem] border border-border/70 bg-background p-5"
                      data-testid={`competency-${competency.competencyId}`}
                    >
                      <div className="flex flex-wrap items-start gap-4">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                          <Bookmark className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <h2 className="text-xl font-semibold tracking-tight">
                            {competency.name}
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            {data.definition?.modelKind === "indicators"
                              ? "Оцените каждый индикатор по шкале 1–5 или выберите «Не могу оценить»."
                              : "Выберите уровень, который лучше всего описывает текущее проявление компетенции."}
                          </p>
                        </div>
                      </div>

                      {data.definition?.modelKind === "indicators" ? (
                        <div className="space-y-4">
                          {competency.indicators?.map((indicator) => {
                            const selectedValue =
                              normalizedDraft.indicatorResponses[competency.competencyId]?.[
                                indicator.indicatorId
                              ] ?? "";

                            return (
                              <div
                                key={indicator.indicatorId}
                                className="space-y-4 rounded-[1.5rem] border border-border/70 bg-muted/15 p-4"
                                data-testid={`indicator-${indicator.indicatorId}`}
                              >
                                <p className="font-medium leading-6">{indicator.text}</p>
                                <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
                                  {indicatorScale.map((option) => (
                                    <label
                                      key={option.value}
                                      className={cn(
                                        "group relative flex cursor-pointer flex-col items-center justify-center rounded-[1.25rem] border border-border/70 bg-background px-3 py-4 text-center transition",
                                        selectedValue === option.value &&
                                          "border-primary bg-primary/8 text-primary shadow-[0_0_0_1px_rgba(37,99,235,0.25)]",
                                        readonly && "cursor-not-allowed opacity-70",
                                      )}
                                    >
                                      <input
                                        type="radio"
                                        name={`indicator:${competency.competencyId}:${indicator.indicatorId}`}
                                        value={option.value}
                                        defaultChecked={selectedValue === option.value}
                                        disabled={readonly}
                                        className="sr-only"
                                        data-testid={`indicator-input-${indicator.indicatorId}-${option.value}`}
                                      />
                                      <span className="text-lg font-semibold">{option.label}</span>
                                      <span className="mt-1 text-[11px] font-medium uppercase leading-4 tracking-[0.12em] text-muted-foreground">
                                        {option.caption}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-muted/15 p-4">
                          <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-5">
                            {levelScale.map((option) => {
                              const selectedValue =
                                normalizedDraft.levelResponses[competency.competencyId] ?? "";

                              return (
                                <label
                                  key={option.value}
                                  className={cn(
                                    "group relative flex cursor-pointer flex-col items-center justify-center rounded-[1.25rem] border border-border/70 bg-background px-3 py-4 text-center transition",
                                    selectedValue === option.value &&
                                      "border-primary bg-primary/8 text-primary shadow-[0_0_0_1px_rgba(37,99,235,0.25)]",
                                    readonly && "cursor-not-allowed opacity-70",
                                  )}
                                >
                                  <input
                                    type="radio"
                                    name={`level:${competency.competencyId}`}
                                    value={option.value}
                                    defaultChecked={selectedValue === option.value}
                                    disabled={readonly}
                                    className="sr-only"
                                    data-testid={`level-input-${competency.competencyId}-${option.value}`}
                                  />
                                  <span className="text-lg font-semibold">{option.label}</span>
                                  <span className="mt-1 text-[11px] font-medium uppercase leading-4 tracking-[0.12em] text-muted-foreground">
                                    {option.caption}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            {competency.levels?.map((level) => (
                              <li key={level.levelId}>
                                <span className="font-medium text-foreground">
                                  Уровень {level.level}:
                                </span>{" "}
                                {level.text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <MessageSquareText className="size-4 text-primary" />
                          <label htmlFor={`comment-${competency.competencyId}`}>
                            Комментарий по компетенции
                          </label>
                        </div>
                        <textarea
                          id={`comment-${competency.competencyId}`}
                          name={`comment:${competency.competencyId}`}
                          defaultValue={
                            normalizedDraft.competencyComments[competency.competencyId] ?? ""
                          }
                          rows={4}
                          disabled={readonly}
                          className="w-full rounded-[1.25rem] border border-border/70 bg-background px-4 py-3 text-sm shadow-sm outline-none transition placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                          placeholder="Добавьте примеры поведения или наблюдения — комментарий опционален."
                          data-testid={`competency-comment-${competency.competencyId}`}
                        />
                      </div>
                    </section>
                  ))}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="rounded-[2rem] border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Комментарий по анкете</CardTitle>
                <CardDescription>
                  Для этой кампании ещё недоступна структурированная модель компетенций, поэтому
                  сохраняем MVP fallback.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  name="note"
                  defaultValue={normalizedDraft.note}
                  rows={8}
                  className="w-full rounded-[1.25rem] border border-border/70 bg-background px-4 py-3 text-sm shadow-sm outline-none transition placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                  placeholder="Опишите наблюдения и примеры поведения."
                  disabled={readonly}
                  data-testid="questionnaire-note"
                />
              </CardContent>
            </Card>
          )}

          <Card className="rounded-[2rem] border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Итоговый комментарий</CardTitle>
              <CardDescription>
                Необязательное summary для всей анкеты — полезно, если хотите связать наблюдения по
                нескольким компетенциям.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                name="finalComment"
                defaultValue={normalizedDraft.finalComment}
                rows={5}
                disabled={readonly}
                className="w-full rounded-[1.25rem] border border-border/70 bg-background px-4 py-3 text-sm shadow-sm outline-none transition placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                placeholder="Сформулируйте итоговые наблюдения по сотруднику."
                data-testid="questionnaire-final-comment"
              />
            </CardContent>
          </Card>

          <Card
            className="sticky bottom-4 rounded-[2rem] border-border/70 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.45)] backdrop-blur"
            data-testid="scr-questionnaires-fill-actions"
          >
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-5">
              <div className="space-y-1">
                <p className="font-semibold">Сохраните прогресс или отправьте форму</p>
                <p className="text-sm text-muted-foreground">
                  Черновик можно обновлять до завершения кампании. После отправки анкета станет
                  read-only.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  formAction={`/api/questionnaires/draft?returnTo=%2Fquestionnaires%2F${data.questionnaireId}`}
                  disabled={readonly}
                  data-testid="save-draft-button"
                  variant="outline"
                  className="rounded-xl"
                >
                  Сохранить черновик
                </Button>
                <Button
                  type="submit"
                  formAction="/api/questionnaires/submit?returnTo=%2Fquestionnaires"
                  disabled={readonly}
                  data-testid="submit-questionnaire-button"
                  className="rounded-xl"
                >
                  Отправить анкету
                  <ArrowRight className="ml-2 size-4" />
                </Button>
                <Button asChild variant="outline" className="rounded-xl">
                  <a href="/questionnaires">К списку анкет</a>
                </Button>
                {readonly ? (
                  <Button asChild variant="outline" className="rounded-xl">
                    <a href="/results" data-testid="go-to-results">
                      К результатам
                    </a>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </InternalAppShell>
  );
}
