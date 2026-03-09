import { PageEmptyState, PageErrorState, PageStateScreen } from "@/components/page-state";
import { Button } from "@/components/ui/button";
import { getAppSession } from "@/lib/app-session";
import { createInprocClient } from "@feedback-360/client";
import { ArrowRightLeft, Building2, CheckCircle2 } from "lucide-react";
import { redirect } from "next/navigation";

const roleLabels: Record<string, string> = {
  hr_admin: "HR-администратор",
  hr_reader: "HR-читатель",
  manager: "Руководитель",
  employee: "Сотрудник",
};

/**
 * Active company switcher screen.
 * @docs .memory-bank/spec/ui/screens/company-switcher.md
 * @see .memory-bank/spec/ui/screen-registry.md
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
    <div className="auth-shell" data-testid="scr-company-switcher-root">
      <header className="auth-topbar">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-6 py-4">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
            <Building2 className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-950">Выбор компании</h1>
            <p className="text-xs text-slate-500">
              Активный workspace определяет весь дальнейший контекст
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100dvh-73px)] w-full max-w-6xl items-center px-6 py-10">
        <div className="w-full space-y-6">
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_320px]">
            <div className="overflow-hidden rounded-[2rem] border-0 bg-gradient-to-br from-primary to-blue-600 p-8 text-white shadow-[0_20px_50px_-24px_rgba(17,82,212,0.9)] md:p-10">
              <div className="max-w-2xl space-y-4">
                <div className="inline-flex items-center rounded-full bg-white/12 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-white/80">
                  Company Context
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                    Выберите компанию, в контексте которой будете работать
                  </h2>
                  <p className="max-w-xl text-sm leading-6 text-white/85 md:text-base">
                    Один и тот же пользователь может состоять в нескольких компаниях. Здесь вы
                    выбираете active company для dashboards, кампаний, анкет и результатов.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="app-kpi-card">
                <p className="app-eyebrow">Доступно компаний</p>
                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {memberships.data.items.length}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Все memberships, к которым привязан текущий аккаунт.
                </p>
              </div>
              <div className="app-kpi-card">
                <p className="app-eyebrow">Pattern</p>
                <p className="mt-3 text-3xl font-bold tracking-tight">Workspace</p>
                <p className="mt-2 text-sm text-slate-500">
                  После выбора вся навигация и роли переключаются в этот контекст.
                </p>
              </div>
              <div className="app-kpi-card">
                <p className="app-eyebrow">Безопасность</p>
                <p className="mt-3 inline-flex items-center gap-2 text-2xl font-bold tracking-tight">
                  <CheckCircle2 className="size-5 text-emerald-500" />
                  Scoped
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Доступ и данные уже отфильтрованы по выбранной компании.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                Доступные компании
              </h2>
              <p className="text-base text-slate-500">
                Выберите организацию и войдите в её рабочее пространство.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2" data-testid="scr-company-switcher-list">
              {memberships.data.items.length === 0 ? (
                <PageEmptyState
                  title="Нет доступных компаний"
                  description="Аккаунт существует, но ещё не привязан ни к одной активной компании. Обратитесь к HR-администратору."
                  actions={[
                    { href: "/auth/login", label: "Вернуться ко входу", variant: "outline" },
                  ]}
                  testId="select-company-empty"
                />
              ) : (
                memberships.data.items.map((item) => (
                  <div
                    key={item.companyId}
                    className="app-surface overflow-hidden p-6"
                    data-testid={`company-card-${item.companyId}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-primary">
                          {roleLabels[item.role] ?? item.role}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold tracking-tight text-slate-950">
                            {item.companyName}
                          </h3>
                          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                            Войдите в контекст этой компании, чтобы открыть home, HR-разделы,
                            questionnaires и results именно для неё.
                          </p>
                        </div>
                      </div>
                      <div className="hidden rounded-2xl bg-slate-100 p-3 text-slate-400 sm:block">
                        <ArrowRightLeft className="size-5" />
                      </div>
                    </div>

                    <form action="/api/session/active-company" method="post" className="mt-6">
                      <input type="hidden" name="companyId" value={item.companyId} />
                      <Button
                        type="submit"
                        className="h-11 w-full rounded-xl text-sm font-semibold"
                        data-testid={`select-company-${item.companyId}`}
                      >
                        Войти в компанию
                      </Button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
