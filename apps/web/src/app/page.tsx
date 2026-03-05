import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppSession } from "@/lib/app-session";
import { createInprocClient } from "@feedback-360/client";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getAppSession();
  if (!session.userId) {
    redirect("/auth/login");
  }
  if (!session.activeCompanyId) {
    redirect("/select-company");
  }

  const client = createInprocClient();
  const memberships = await client.membershipList(
    {},
    {
      userId: session.userId,
    },
  );
  const activeMembership = memberships.ok
    ? memberships.data.items.find((item) => item.companyId === session.activeCompanyId)
    : undefined;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl items-center p-6">
      <Card className="w-full">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-semibold tracking-tight">go360go</CardTitle>
          <p className="text-muted-foreground">Staging: beta.go360go.ru</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border p-4 text-sm">
            <p className="text-muted-foreground">Текущая компания</p>
            <p className="font-medium" data-testid="active-company-name">
              {activeMembership?.companyName ?? session.activeCompanyId}
            </p>
            <p className="text-xs text-muted-foreground" data-testid="active-company-id">
              {session.activeCompanyId}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <a href="/questionnaires">Мои анкеты</a>
            </Button>
            <Button asChild variant="secondary">
              <a href="/results">Мои результаты</a>
            </Button>
            {activeMembership?.role === "manager" ? (
              <Button asChild variant="secondary">
                <a href="/results/team">Результаты команды</a>
              </Button>
            ) : null}
            {activeMembership?.role === "hr_admin" || activeMembership?.role === "hr_reader" ? (
              <Button asChild variant="secondary">
                <a href="/results/hr">HR результаты</a>
              </Button>
            ) : null}
            <Button asChild>
              <a href="/select-company">Сменить компанию</a>
            </Button>
            <form action="/api/session/logout" method="post">
              <Button variant="outline" type="submit">
                Выйти
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
