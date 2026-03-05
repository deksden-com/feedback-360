import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveAppOperationContext } from "@/lib/operation-context";
import { createInprocClient } from "@feedback-360/client";
import { redirect } from "next/navigation";

const statusLabels: Record<string, string> = {
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

const errorLabels: Record<string, string> = {
  campaign_ended_readonly: "Кампания завершена. Анкета доступна только для чтения.",
  invalid_transition: "Невозможно выполнить действие в текущем состоянии анкеты.",
  forbidden: "Недостаточно прав для выполнения действия.",
};

export default async function QuestionnairesPage({
  searchParams,
}: {
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
            <CardTitle>Не удалось загрузить анкеты</CardTitle>
            <CardDescription>{resolved.error.message}</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const params = searchParams ? await searchParams : undefined;
  const saved = getQueryValue(params?.saved) === "1";
  const submitted = getQueryValue(params?.submitted) === "1";
  const errorCode = getQueryValue(params?.error);

  const client = createInprocClient();
  const questionnaires = await client.questionnaireListAssigned({}, resolved.context);
  if (!questionnaires.ok) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-4xl items-center p-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Не удалось загрузить анкеты</CardTitle>
            <CardDescription>{questionnaires.error.message}</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl p-6">
      <div className="w-full space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Мои анкеты</h1>
          <p className="text-muted-foreground">
            Заполняйте анкеты, сохраняйте черновик и отправляйте итоговый ответ.
          </p>
        </div>

        {saved ? (
          <Card className="border-emerald-300 bg-emerald-50" data-testid="flash-saved">
            <CardContent className="py-3 text-sm text-emerald-900">Черновик сохранён.</CardContent>
          </Card>
        ) : null}
        {submitted ? (
          <Card className="border-emerald-300 bg-emerald-50" data-testid="flash-submitted">
            <CardContent className="py-3 text-sm text-emerald-900">Анкета отправлена.</CardContent>
          </Card>
        ) : null}
        {errorCode ? (
          <Card className="border-destructive/40 bg-destructive/5" data-testid="flash-error">
            <CardContent className="py-3 text-sm text-destructive">
              {errorLabels[errorCode] ?? `Ошибка: ${errorCode}`}
            </CardContent>
          </Card>
        ) : null}

        {questionnaires.data.items.length === 0 ? (
          <Card data-testid="questionnaire-empty">
            <CardHeader>
              <CardTitle className="text-xl">Нет назначенных анкет</CardTitle>
              <CardDescription>
                Когда вас добавят в матрицу оценивания, анкеты появятся в этом списке.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4">
            {questionnaires.data.items.map((item) => (
              <Card
                key={item.questionnaireId}
                data-testid={`questionnaire-row-${item.questionnaireId}`}
              >
                <CardHeader className="space-y-2">
                  <CardTitle className="text-lg">Анкета #{item.questionnaireId}</CardTitle>
                  <CardDescription>
                    Статус:{" "}
                    <span data-testid={`questionnaire-status-${item.questionnaireId}`}>
                      {statusLabels[item.status] ?? item.status}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button asChild data-testid={`open-questionnaire-${item.questionnaireId}`}>
                    <a href={`/questionnaires/${item.questionnaireId}`}>Открыть</a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href="/">На главную</a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
