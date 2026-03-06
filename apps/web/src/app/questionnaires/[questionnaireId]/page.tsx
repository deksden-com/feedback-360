import { InternalAppShell } from "@/components/internal-app-shell";
import { InlineBanner, PageErrorState, PageStateScreen } from "@/components/page-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { applyDebugPageDelay } from "@/lib/debug-page-delay";
import { resolveAppOperationContext } from "@/lib/operation-context";
import { getFriendlyErrorCopy } from "@/lib/page-state";
import { createInprocClient } from "@feedback-360/client";
import { redirect } from "next/navigation";

const campaignStatusLabels: Record<string, string> = {
  draft: "Черновик",
  started: "Запущена",
  ended: "Завершена",
  processing_ai: "Обработка ИИ",
  ai_failed: "Ошибка ИИ",
  completed: "Завершена и обработана",
};

const questionnaireStatusLabels: Record<string, string> = {
  not_started: "Не начата",
  in_progress: "Черновик",
  submitted: "Отправлена",
};

const getQueryValue = (value: string | string[] | undefined): string | undefined => {
  if (typeof value === "string") {
    return value;
  }
  return value?.[0];
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

  const note =
    typeof questionnaire.data.draft.note === "string" ? questionnaire.data.draft.note : "";
  const readonly = isReadonlyState(questionnaire.data.status, questionnaire.data.campaignStatus);

  return (
    <InternalAppShell
      context={resolved.context}
      currentPath="/questionnaires"
      title={`Анкета #${questionnaire.data.questionnaireId}`}
      subtitle={`Статус анкеты: ${
        questionnaireStatusLabels[questionnaire.data.status] ?? questionnaire.data.status
      } · Кампания: ${
        campaignStatusLabels[questionnaire.data.campaignStatus] ?? questionnaire.data.campaignStatus
      }`}
    >
      {saved ? (
        <InlineBanner
          description="Черновик сохранён."
          tone="success"
          testId="questionnaire-flash-saved"
        />
      ) : null}
      {submitted ? (
        <InlineBanner
          description="Анкета отправлена."
          tone="success"
          testId="questionnaire-flash-submitted"
        />
      ) : null}
      {errorCode ? (
        <InlineBanner
          description="Не удалось выполнить действие. Обновите страницу и попробуйте снова."
          tone="error"
          testId="questionnaire-flash-error"
        />
      ) : null}
      {readonly ? (
        <InlineBanner
          description="Анкета доступна только для чтения."
          tone="warning"
          testId="readonly-banner"
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Комментарий по компетенции (MVP)</CardTitle>
          <CardDescription>
            На этапе MVP форма анкеты упрощена до текстового поля для проверки draft/save/submit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form action="/api/questionnaires/draft" method="post" className="space-y-3">
            <input
              type="hidden"
              name="questionnaireId"
              value={questionnaire.data.questionnaireId}
            />
            <input
              type="hidden"
              name="returnTo"
              value={`/questionnaires/${questionnaire.data.questionnaireId}`}
            />
            <textarea
              name="note"
              defaultValue={note}
              rows={8}
              className="w-full rounded-md border p-3 text-sm"
              placeholder="Опишите наблюдения и примеры поведения."
              disabled={readonly}
              data-testid="questionnaire-note"
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={readonly} data-testid="save-draft-button">
                Сохранить черновик
              </Button>
              <Button asChild variant="outline">
                <a href="/questionnaires">К списку анкет</a>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Отправка анкеты</CardTitle>
          <CardDescription>После отправки анкета становится неизменяемой.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/api/questionnaires/submit" method="post" className="space-y-3">
            <input
              type="hidden"
              name="questionnaireId"
              value={questionnaire.data.questionnaireId}
            />
            <input type="hidden" name="returnTo" value="/questionnaires" />
            <Button type="submit" disabled={readonly} data-testid="submit-questionnaire-button">
              Отправить анкету
            </Button>
          </form>
        </CardContent>
      </Card>
    </InternalAppShell>
  );
}
