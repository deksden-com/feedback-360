import { PageEmptyState, PageErrorState, PageStateScreen } from "@/components/page-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppSession } from "@/lib/app-session";
import { createInprocClient } from "@feedback-360/client";
import { redirect } from "next/navigation";

const roleLabels: Record<string, string> = {
  hr_admin: "HR-администратор",
  hr_reader: "HR-читатель",
  manager: "Руководитель",
  employee: "Сотрудник",
};

/**
 * Active company switcher screen.
 * @screenId SCR-COMPANY-SWITCHER
 * @testIdScope scr-company-switcher
 */
export default async function SelectCompanyPage() {
  const session = await getAppSession();
  if (!session.userId) {
    redirect("/auth/login");
  }

  const client = createInprocClient();
  const memberships = await client.membershipList(
    {},
    {
      userId: session.userId,
    },
  );

  if (!memberships.ok) {
    return (
      <PageStateScreen>
        <PageErrorState
          title="Не удалось загрузить компании"
          description="Не получилось получить список доступных компаний. Попробуйте снова или выполните вход ещё раз."
          actions={[{ href: "/auth/login", label: "Вернуться ко входу", variant: "outline" }]}
        />
      </PageStateScreen>
    );
  }

  return (
    <main
      className="mx-auto flex min-h-dvh w-full max-w-5xl items-center p-6"
      data-testid="scr-company-switcher-root"
    >
      <div className="w-full space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Выберите компанию</h1>
          <p className="text-muted-foreground">
            Ваш аккаунт связан с несколькими организациями. Выберите активный контекст.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2" data-testid="scr-company-switcher-list">
          {memberships.data.items.length === 0 ? (
            <PageEmptyState
              title="Нет доступных компаний"
              description="Аккаунт существует, но ещё не привязан ни к одной активной компании. Обратитесь к HR-администратору."
              actions={[{ href: "/auth/login", label: "Вернуться ко входу", variant: "outline" }]}
              testId="select-company-empty"
            />
          ) : (
            memberships.data.items.map((item) => (
              <Card key={item.companyId} data-testid={`company-card-${item.companyId}`}>
                <CardHeader>
                  <CardTitle className="text-xl">{item.companyName}</CardTitle>
                  <CardDescription>{roleLabels[item.role] ?? item.role}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form action="/api/session/active-company" method="post">
                    <input type="hidden" name="companyId" value={item.companyId} />
                    <Button
                      type="submit"
                      className="w-full"
                      data-testid={`select-company-${item.companyId}`}
                    >
                      Войти
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
