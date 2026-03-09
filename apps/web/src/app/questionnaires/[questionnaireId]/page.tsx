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
  { value: "1", label: "1", caption: "Needs Improvement" },
  { value: "2", label: "2", caption: "Below Expectations" },
  { value: "3", label: "3", caption: "Meets Expectations" },
  { value: "4", label: "4", caption: "Exceeds Expectations" },
  { value: "5", label: "5", caption: "Outstanding" },
  { value: "NA", label: "N/A", caption: "Not Applicable" },
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

const getFocusedCompetencyId = (
  definition:
    | {
        modelKind: "indicators" | "levels";
        groups: Array<{
          competencies: Array<{
            competencyId: string;
            indicators?: Array<{ indicatorId: string }>;
          }>;
        }>;
      }
    | undefined,
  draft: ReturnType<typeof normalizeQuestionnaireDraft>,
) => {
  if (!definition) {
    return undefined;
  }

  for (const group of definition.groups) {
    for (const competency of group.competencies) {
      if (definition.modelKind === "indicators") {
        const indicatorValues = draft.indicatorResponses[competency.competencyId] ?? {};
        const totalIndicators = competency.indicators?.length ?? 0;
        const answeredIndicators = Object.values(indicatorValues).filter(Boolean).length;
        if (answeredIndicators < totalIndicators) {
          return competency.competencyId;
        }
      } else {
        const levelValue = draft.levelResponses[competency.competencyId] ?? "";
        if (!levelValue) {
          return competency.competencyId;
        }
      }
    }
  }

  return definition.groups.flatMap((group) => group.competencies)[0]?.competencyId;
};

/**
 * Questionnaire fill/read-only screen.
 * @docs .memory-bank/spec/ui/screens/questionnaire-fill.md
 * @see .memory-bank/spec/ui/screen-registry.md
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
  const definition = data.definition;
  const readonly = isReadonlyState(data.status, data.campaignStatus);
  const normalizedDraft = normalizeQuestionnaireDraft(data.draft);
  const progress = getQuestionnaireProgress(definition, normalizedDraft);
  const progressPercent = getProgressPercent(progress.answeredPrompts, progress.totalPrompts);
  const focusedCompetencyId = getFocusedCompetencyId(definition, normalizedDraft);

  return (
    <InternalAppShell
      context={resolved.context}
      currentPath="/questionnaires"
      title={`Assessing: ${data.subjectDisplayName ?? data.questionnaireId}`}
      subtitle={`${data.subjectPositionTitle ?? "Сотрудник"} · ${data.campaignName}`}
    >
      <div className="mx-auto max-w-5xl space-y-8" data-testid="scr-questionnaires-fill-root">
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

        <section className="space-y-6" data-testid="scr-questionnaires-fill-summary">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ClipboardCheck className="size-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-950">
                  Оцениваете: {data.subjectDisplayName ?? `Сотрудник ${data.subjectEmployeeId}`}
                </h2>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  {data.subjectPositionTitle ?? "Сотрудник"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-4 py-2">
                <Clock3 className="size-4 text-slate-500" />
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-700">
                  {formatDeadlineDistance(data.campaignEndAt)}
                </span>
              </div>
              <div className="inline-flex items-center gap-2">
                <BriefcaseBusiness className="size-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-600">{data.campaignName}</span>
              </div>
            </div>
          </div>

          <div
            className="rounded-xl border border-slate-100 bg-white p-8 shadow-sm"
            data-testid="questionnaire-progress-card"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                  Competencies Completed
                </p>
                <p className="text-sm font-bold text-primary" data-testid="questionnaire-progress">
                  {progress.completedCompetencies} / {progress.totalCompetencies}
                </p>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                  <Target className="size-4" />
                  Ответов: {progress.answeredPrompts}/{progress.totalPrompts}
                </span>
                <span>
                  {data.raterRole ? questionnaireRaterRoleLabels[data.raterRole] : "Оценивающий"}
                </span>
                <span>Статус: {questionnaireStatusLabels[data.status]}</span>
                {data.submittedAt ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-700">
                    <CheckCircle2 className="size-4" />
                    Отправлена {formatDate(data.submittedAt)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <form method="post" className="space-y-8" data-testid="scr-questionnaires-fill-form">
          <input type="hidden" name="questionnaireId" value={data.questionnaireId} />

          {definition ? (
            definition.groups.map((group) => (
              <div key={group.groupId} className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                      {group.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      Вес группы: {group.weight}% · Компетенций: {group.competencies.length}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-500">
                    <CircleHelp className="size-4" />
                    {definition.modelKind === "indicators"
                      ? "Оцените каждый индикатор"
                      : "Выберите один уровень"}
                  </div>
                </div>

                <div className="space-y-8">
                  {group.competencies.map((competency) => (
                    <article
                      key={competency.competencyId}
                      className={cn(
                        "overflow-hidden rounded-xl bg-white transition-all",
                        focusedCompetencyId === competency.competencyId
                          ? "border-2 border-primary shadow-md ring-8 ring-primary/15"
                          : "border border-slate-100 shadow-sm",
                      )}
                      data-testid={`competency-${competency.competencyId}`}
                    >
                      <div className="border-b border-slate-100 p-8">
                        <div className="flex items-start gap-5">
                          <div className="mt-1 rounded-xl bg-primary/10 p-3 text-primary">
                            <Bookmark className="size-6" />
                          </div>
                          <div className="space-y-3">
                            <h2 className="text-xl font-bold tracking-tight text-slate-950">
                              {competency.name}
                            </h2>
                            <p className="text-base leading-7 text-slate-600">
                              {definition.modelKind === "indicators"
                                ? "Оцените каждый индикатор по шкале 1–5 или выберите «Не могу оценить», если наблюдений недостаточно."
                                : "Выберите уровень, который лучше всего описывает текущее проявление компетенции."}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-8 bg-slate-50/30 p-8">
                        {definition.modelKind === "indicators" ? (
                          <div className="space-y-6">
                            <p className="block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                              Rating Scale
                            </p>
                            {competency.indicators?.map((indicator) => {
                              const selectedValue =
                                normalizedDraft.indicatorResponses[competency.competencyId]?.[
                                  indicator.indicatorId
                                ] ?? "";

                              return (
                                <div
                                  key={indicator.indicatorId}
                                  className="space-y-5"
                                  data-testid={`indicator-${indicator.indicatorId}`}
                                >
                                  <p className="text-base font-medium leading-7 text-slate-700">
                                    {indicator.text}
                                  </p>
                                  <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
                                    {indicatorScale.map((option) => {
                                      const selected = selectedValue === option.value;
                                      const isNa = option.value === "NA";

                                      return (
                                        <label
                                          key={option.value}
                                          className={cn(
                                            "cursor-pointer",
                                            readonly && "cursor-not-allowed opacity-70",
                                          )}
                                        >
                                          <input
                                            type="radio"
                                            name={`indicator:${competency.competencyId}:${indicator.indicatorId}`}
                                            value={option.value}
                                            defaultChecked={selected}
                                            disabled={readonly}
                                            className="peer sr-only"
                                            data-testid={`indicator-input-${indicator.indicatorId}-${option.value}`}
                                          />
                                          <div
                                            className={cn(
                                              "flex h-full flex-col justify-between rounded-xl border border-slate-100 bg-white p-4 text-center transition-all duration-200 hover:border-slate-300",
                                              selected &&
                                                !isNa &&
                                                "border-2 border-primary bg-primary/10 ring-2 ring-primary/20",
                                              selected &&
                                                isNa &&
                                                "border-slate-400 bg-slate-100 ring-1 ring-slate-400",
                                              isNa && "bg-slate-50/60",
                                            )}
                                          >
                                            <div
                                              className={cn(
                                                "mb-3 text-xl font-bold text-slate-950",
                                                selected && !isNa && "text-primary",
                                                isNa && "text-slate-400",
                                              )}
                                            >
                                              {option.label}
                                            </div>
                                            <div
                                              className={cn(
                                                "min-h-[28px] text-[10px] font-bold uppercase tracking-tight text-slate-400",
                                                selected && !isNa && "text-primary",
                                              )}
                                            >
                                              {option.caption}
                                            </div>
                                          </div>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <p className="block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                              Rating Scale
                            </p>
                            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
                              {levelScale.map((option) => {
                                const selectedValue =
                                  normalizedDraft.levelResponses[competency.competencyId] ?? "";
                                const selected = selectedValue === option.value;
                                const isUnsure = option.value === "UNSURE";

                                return (
                                  <label
                                    key={option.value}
                                    className={cn(
                                      "cursor-pointer",
                                      readonly && "cursor-not-allowed opacity-70",
                                    )}
                                  >
                                    <input
                                      type="radio"
                                      name={`level:${competency.competencyId}`}
                                      value={option.value}
                                      defaultChecked={selected}
                                      disabled={readonly}
                                      className="peer sr-only"
                                      data-testid={`level-input-${competency.competencyId}-${option.value}`}
                                    />
                                    <div
                                      className={cn(
                                        "flex h-full flex-col justify-between rounded-xl border border-slate-100 bg-white p-4 text-center transition-all duration-200 hover:border-slate-300",
                                        selected &&
                                          !isUnsure &&
                                          "border-2 border-primary bg-primary/10 ring-2 ring-primary/20",
                                        selected &&
                                          isUnsure &&
                                          "border-slate-400 bg-slate-100 ring-1 ring-slate-400",
                                      )}
                                    >
                                      <div
                                        className={cn(
                                          "mb-3 text-xl font-bold text-slate-950",
                                          selected && !isUnsure && "text-primary",
                                        )}
                                      >
                                        {option.label}
                                      </div>
                                      <div
                                        className={cn(
                                          "min-h-[28px] text-[10px] font-bold uppercase tracking-tight text-slate-400",
                                          selected && !isUnsure && "text-primary",
                                        )}
                                      >
                                        {option.caption}
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                            <ul className="space-y-2 text-sm text-slate-500">
                              {competency.levels?.map((level) => (
                                <li key={level.levelId}>
                                  <span className="font-medium text-slate-950">
                                    Уровень {level.level}:
                                  </span>{" "}
                                  {level.text}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="space-y-3">
                          <label
                            htmlFor={`comment-${competency.competencyId}`}
                            className="block text-sm font-bold text-slate-700"
                          >
                            Comments (Optional)
                          </label>
                          <textarea
                            id={`comment-${competency.competencyId}`}
                            name={`comment:${competency.competencyId}`}
                            defaultValue={
                              normalizedDraft.competencyComments[competency.competencyId] ?? ""
                            }
                            rows={4}
                            disabled={readonly}
                            className="w-full resize-none rounded-xl border-slate-200 bg-white px-4 py-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                            placeholder="Provide specific examples to support your rating..."
                            data-testid={`competency-comment-${competency.competencyId}`}
                          />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <Card className="rounded-xl border-slate-100 shadow-sm">
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
                  className="w-full rounded-xl border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                  placeholder="Опишите наблюдения и примеры поведения."
                  disabled={readonly}
                  data-testid="questionnaire-note"
                />
              </CardContent>
            </Card>
          )}

          <Card className="rounded-xl border-slate-100 shadow-sm">
            <CardHeader className="space-y-4 p-8 pb-0">
              <CardTitle className="flex items-center gap-3 text-xl font-bold">
                <span className="rounded-lg bg-primary/10 p-2 text-primary">
                  <MessageSquareText className="size-5" />
                </span>
                General Feedback
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-slate-500">
                Please provide any overall comments, strengths, or areas for development that were
                not covered in the specific competencies above.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <textarea
                name="finalComment"
                defaultValue={normalizedDraft.finalComment}
                rows={6}
                disabled={readonly}
                className="w-full resize-none rounded-xl border-slate-200 bg-slate-50/50 px-5 py-5 text-sm text-slate-900 shadow-inner outline-none transition placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                placeholder="Enter your general feedback here..."
                data-testid="questionnaire-final-comment"
              />
            </CardContent>
          </Card>

          <section
            className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-slate-200 py-10 sm:flex-row"
            data-testid="scr-questionnaires-fill-actions"
          >
            <div className="text-sm text-slate-500">
              {data.firstDraftAt
                ? `Первый черновик сохранён ${formatDate(data.firstDraftAt)}`
                : "Черновик можно сохранять до завершения кампании."}
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
              <Button
                type="submit"
                formAction={`/api/questionnaires/draft?returnTo=%2Fquestionnaires%2F${data.questionnaireId}`}
                disabled={readonly}
                data-testid="save-draft-button"
                variant="outline"
                className="h-12 rounded-xl border-slate-200 px-8 text-sm font-bold text-slate-600"
              >
                Сохранить черновик
              </Button>
              <Button
                type="submit"
                formAction="/api/questionnaires/submit?returnTo=%2Fquestionnaires"
                disabled={readonly}
                data-testid="submit-questionnaire-button"
                className="h-12 rounded-xl px-10 text-sm font-bold shadow-lg shadow-primary/25"
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
          </section>
        </form>
      </div>
    </InternalAppShell>
  );
}
