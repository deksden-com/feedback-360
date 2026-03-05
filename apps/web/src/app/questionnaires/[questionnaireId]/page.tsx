import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveAppOperationContext } from "@/lib/operation-context";
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
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-3xl items-center p-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Не удалось открыть анкету</CardTitle>
            <CardDescription>{resolved.error.message}</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const routeParams = await params;
  const query = searchParams ? await searchParams : undefined;
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
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-3xl items-center p-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Не удалось открыть анкету</CardTitle>
            <CardDescription>{questionnaire.error.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <a href="/questionnaires">К списку анкет</a>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const note =
    typeof questionnaire.data.draft.note === "string" ? questionnaire.data.draft.note : "";
  const readonly = isReadonlyState(questionnaire.data.status, questionnaire.data.campaignStatus);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl p-6">
      <div className="w-full space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Анкета #{questionnaire.data.questionnaireId}
          </h1>
          <p className="text-muted-foreground">
            Статус анкеты:{" "}
            {questionnaireStatusLabels[questionnaire.data.status] ?? questionnaire.data.status}
            {" · "}
            Кампания:{" "}
            {campaignStatusLabels[questionnaire.data.campaignStatus] ??
              questionnaire.data.campaignStatus}
          </p>
        </div>

        {saved ? (
          <Card
            className="border-emerald-300 bg-emerald-50"
            data-testid="questionnaire-flash-saved"
          >
            <CardContent className="py-3 text-sm text-emerald-900">Черновик сохранён.</CardContent>
          </Card>
        ) : null}
        {submitted ? (
          <Card
            className="border-emerald-300 bg-emerald-50"
            data-testid="questionnaire-flash-submitted"
          >
            <CardContent className="py-3 text-sm text-emerald-900">Анкета отправлена.</CardContent>
          </Card>
        ) : null}
        {errorCode ? (
          <Card
            className="border-destructive/40 bg-destructive/5"
            data-testid="questionnaire-flash-error"
          >
            <CardContent className="py-3 text-sm text-destructive">Ошибка: {errorCode}</CardContent>
          </Card>
        ) : null}
        {readonly ? (
          <Card className="border-amber-300 bg-amber-50" data-testid="readonly-banner">
            <CardContent className="py-3 text-sm text-amber-950">
              Анкета доступна только для чтения.
            </CardContent>
          </Card>
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
      </div>
    </main>
  );
}
