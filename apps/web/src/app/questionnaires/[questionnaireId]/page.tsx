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
import { redirect } from "next/navigation";

const indicatorScale = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "NA", label: "Не могу оценить" },
] as const;

const levelScale = [
  { value: "1", label: "Уровень 1" },
  { value: "2", label: "Уровень 2" },
  { value: "3", label: "Уровень 3" },
  { value: "4", label: "Уровень 4" },
  { value: "UNSURE", label: "Затрудняюсь ответить" },
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

        <div
          className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]"
          data-testid="scr-questionnaires-fill-summary"
        >
          <Card className="overflow-hidden border-border/80 shadow-sm">
            <CardHeader className="space-y-4 border-b bg-muted/25">
              <div className="space-y-1">
                <CardTitle className="text-2xl">
                  {data.subjectDisplayName ?? `Сотрудник ${data.subjectEmployeeId}`}
                </CardTitle>
                <CardDescription>
                  {data.subjectPositionTitle ? `${data.subjectPositionTitle} · ` : ""}
                  {data.raterRole ? questionnaireRaterRoleLabels[data.raterRole] : "Оценивающий"}
                </CardDescription>
              </div>
              <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                <p>
                  Кампания: <span className="font-medium text-foreground">{data.campaignName}</span>
                </p>
                <p>
                  Дедлайн:{" "}
                  <span className="font-medium text-foreground">
                    {formatDate(data.campaignEndAt)}
                  </span>
                </p>
                <p>
                  Статус анкеты:{" "}
                  <span className="font-medium text-foreground">
                    {questionnaireStatusLabels[data.status]}
                  </span>
                </p>
                <p>
                  Состояние кампании:{" "}
                  <span className="font-medium text-foreground">
                    {campaignStatusLabels[data.campaignStatus]}
                  </span>
                </p>
              </div>
            </CardHeader>
          </Card>

          <Card
            className="border-border/80 shadow-sm lg:sticky lg:top-6"
            data-testid="questionnaire-progress-card"
          >
            <CardHeader className="space-y-1">
              <CardDescription>Прогресс заполнения</CardDescription>
              <CardTitle className="text-3xl" data-testid="questionnaire-progress">
                {progress.answeredPrompts}/{progress.totalPrompts}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Компетенции готовы:{" "}
                <span className="font-medium text-foreground">
                  {progress.completedCompetencies}/{progress.totalCompetencies}
                </span>
              </p>
              <p>
                {data.firstDraftAt
                  ? `Первый черновик сохранён ${formatDate(data.firstDraftAt)}`
                  : "Черновик ещё не сохранялся."}
              </p>
              {data.submittedAt ? <p>Отправлена {formatDate(data.submittedAt)}</p> : null}
            </CardContent>
          </Card>
        </div>

        <form method="post" className="space-y-6" data-testid="scr-questionnaires-fill-form">
          <input type="hidden" name="questionnaireId" value={data.questionnaireId} />

          {data.definition ? (
            data.definition.groups.map((group) => (
              <Card key={group.groupId} className="border-border/80 shadow-sm">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-xl">{group.name}</CardTitle>
                  <CardDescription>
                    Вес группы: {group.weight}% · Компетенций: {group.competencies.length}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {group.competencies.map((competency) => (
                    <section
                      key={competency.competencyId}
                      className="space-y-4 border-t pt-6 first:border-t-0 first:pt-0"
                      data-testid={`competency-${competency.competencyId}`}
                    >
                      <div className="space-y-1">
                        <h2 className="text-lg font-semibold">{competency.name}</h2>
                        <p className="text-sm text-muted-foreground">
                          {data.definition?.modelKind === "indicators"
                            ? "Оцените каждый индикатор по шкале 1–5 или выберите «Не могу оценить»."
                            : "Выберите уровень, который лучше всего описывает текущее проявление компетенции."}
                        </p>
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
                                className="rounded-xl border p-4"
                                data-testid={`indicator-${indicator.indicatorId}`}
                              >
                                <p className="mb-3 font-medium">{indicator.text}</p>
                                <div className="flex flex-wrap gap-2">
                                  {indicatorScale.map((option) => (
                                    <label
                                      key={option.value}
                                      className={cn(
                                        "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm",
                                        selectedValue === option.value &&
                                          "border-primary bg-primary/10 text-primary",
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
                                      <span>{option.label}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-xl border p-4">
                          <div className="flex flex-wrap gap-2">
                            {levelScale.map((option) => {
                              const selectedValue =
                                normalizedDraft.levelResponses[competency.competencyId] ?? "";

                              return (
                                <label
                                  key={option.value}
                                  className={cn(
                                    "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm",
                                    selectedValue === option.value &&
                                      "border-primary bg-primary/10 text-primary",
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
                                  <span>{option.label}</span>
                                </label>
                              );
                            })}
                          </div>
                          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
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
                        <label
                          htmlFor={`comment-${competency.competencyId}`}
                          className="text-sm font-medium"
                        >
                          Комментарий по компетенции
                        </label>
                        <textarea
                          id={`comment-${competency.competencyId}`}
                          name={`comment:${competency.competencyId}`}
                          defaultValue={
                            normalizedDraft.competencyComments[competency.competencyId] ?? ""
                          }
                          rows={4}
                          disabled={readonly}
                          className="w-full rounded-md border p-3 text-sm"
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
            <Card className="border-border/80 shadow-sm">
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
                  className="w-full rounded-md border p-3 text-sm"
                  placeholder="Опишите наблюдения и примеры поведения."
                  disabled={readonly}
                  data-testid="questionnaire-note"
                />
              </CardContent>
            </Card>
          )}

          <Card className="border-border/80 shadow-sm">
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
                className="w-full rounded-md border p-3 text-sm"
                placeholder="Сформулируйте итоговые наблюдения по сотруднику."
                data-testid="questionnaire-final-comment"
              />
            </CardContent>
          </Card>

          <Card
            className="border-border/80 shadow-sm"
            data-testid="scr-questionnaires-fill-actions"
          >
            <CardHeader>
              <CardTitle className="text-xl">Действия</CardTitle>
              <CardDescription>
                Сначала можно сохранить черновик, а когда всё готово — отправить анкету.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                type="submit"
                formAction={`/api/questionnaires/draft?returnTo=%2Fquestionnaires%2F${data.questionnaireId}`}
                disabled={readonly}
                data-testid="save-draft-button"
              >
                Сохранить черновик
              </Button>
              <Button
                type="submit"
                formAction="/api/questionnaires/submit?returnTo=%2Fquestionnaires"
                disabled={readonly}
                data-testid="submit-questionnaire-button"
              >
                Отправить анкету
              </Button>
              <Button asChild variant="outline">
                <a href="/questionnaires">К списку анкет</a>
              </Button>
              {readonly ? (
                <Button asChild variant="outline">
                  <a href="/results" data-testid="go-to-results">
                    К результатам
                  </a>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </form>
      </div>
    </InternalAppShell>
  );
}
