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

  return (
    <InternalAppShell
      context={resolved.context}
      currentPath="/questionnaires"
      title="Мои анкеты"
      subtitle="Заполняйте анкеты, сохраняйте черновик и отправляйте итоговый ответ."
    >
      {saved ? (
        <InlineBanner description="Черновик сохранён." tone="success" testId="flash-saved" />
      ) : null}
      {submitted ? (
        <InlineBanner description="Анкета отправлена." tone="success" testId="flash-submitted" />
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

      {questionnaires.data.items.length === 0 ? (
        <PageEmptyState
          title="Нет назначенных анкет"
          description="Когда вас добавят в матрицу оценивания, анкеты появятся в этом списке."
          actions={[{ href: "/", label: "Перейти на главную", variant: "outline" }]}
          testId="questionnaire-empty"
        />
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </InternalAppShell>
  );
}
