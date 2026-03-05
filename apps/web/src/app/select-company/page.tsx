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
      <main className="mx-auto flex min-h-dvh w-full max-w-3xl items-center p-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Не удалось загрузить компании</CardTitle>
            <CardDescription>{memberships.error.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/auth/login" className="text-sm text-primary underline">
              Вернуться к входу
            </a>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl items-center p-6">
      <div className="w-full space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Выберите компанию</h1>
          <p className="text-muted-foreground">
            Ваш аккаунт связан с несколькими организациями. Выберите активный контекст.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {memberships.data.items.map((item) => (
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
          ))}
        </div>
      </div>
    </main>
  );
}
