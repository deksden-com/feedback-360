import { InternalAppShell } from "@/components/internal-app-shell";
import { PageErrorState, PageStateScreen } from "@/components/page-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveAppOperationContext } from "@/lib/operation-context";
import { getFriendlyErrorCopy } from "@/lib/page-state";
import { redirect } from "next/navigation";

/**
 * HR employee create screen.
 * @docs .memory-bank/spec/ui/screens/hr-employee-create.md
 * @see .memory-bank/spec/ui/screen-registry.md
 * @screenId SCR-HR-EMPLOYEE-CREATE
 * @testIdScope scr-hr-employee-create
 */
export default async function NewEmployeePage() {
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
      title: "Не удалось открыть форму сотрудника",
      description: "Попробуйте обновить страницу или войти заново.",
    });

    return (
      <PageStateScreen>
        <PageErrorState title={state.title} description={state.description} />
      </PageStateScreen>
    );
  }

  if (resolved.context.role !== "hr_admin") {
    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/hr/employees"
        title="Новый сотрудник"
        subtitle="Создание доступно только для HR Admin."
      >
        <PageErrorState
          title="Недостаточно прав"
          description="Только HR Admin может создавать и редактировать сотрудников."
          actions={[
            { href: "/hr/employees", label: "Вернуться к справочнику", variant: "outline" },
          ]}
        />
      </InternalAppShell>
    );
  }

  return (
    <InternalAppShell
      context={resolved.context}
      currentPath="/hr/employees"
      title="Новый сотрудник"
      subtitle="Создайте запись Employee, затем при необходимости привяжите User account и company role."
    >
      <div className="space-y-4" data-testid="scr-hr-employee-create-root">
        <Card className="overflow-hidden rounded-[2rem] border-0 bg-[#2563eb] text-white shadow-[0_20px_50px_-24px_rgba(37,99,235,0.9)]">
          <CardContent className="relative p-8 md:p-10">
            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="inline-flex items-center rounded-full bg-white/12 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-white/80">
                Employee Create
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Сначала создаём HR-запись, потом выдаём доступ
                </h2>
                <p className="max-w-xl text-sm leading-6 text-white/80 md:text-base">
                  Employee и User — разные сущности. На этом шаге фиксируем человека в HR каталоге,
                  а доступ и role обновляем уже из профиля.
                </p>
              </div>
            </div>
            <div className="absolute right-6 top-6 hidden h-36 w-36 rounded-[2rem] bg-white/10 lg:block" />
            <div className="absolute bottom-6 right-8 hidden h-24 w-24 rounded-[1.5rem] border border-white/10 bg-white/8 lg:block" />
          </CardContent>
        </Card>
        <Card className="rounded-[1.75rem] border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Профиль сотрудника</CardTitle>
            <CardDescription>
              Employee и User — разные сущности. Сначала создаём HR-запись, затем на странице
              профиля привязываем доступ.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action="/api/hr/employees/upsert"
              method="post"
              className="grid gap-4 md:grid-cols-2"
              data-testid="employee-create-form"
            >
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="employee-email">Email</Label>
                <Input
                  id="employee-email"
                  name="email"
                  type="email"
                  required
                  data-testid="employee-form-email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="employee-first-name">Имя</Label>
                <Input
                  id="employee-first-name"
                  name="firstName"
                  data-testid="employee-form-first-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="employee-last-name">Фамилия</Label>
                <Input
                  id="employee-last-name"
                  name="lastName"
                  data-testid="employee-form-last-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="employee-phone">Телефон</Label>
                <Input id="employee-phone" name="phone" data-testid="employee-form-phone" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="employee-telegram-user-id">Telegram user id</Label>
                <Input
                  id="employee-telegram-user-id"
                  name="telegramUserId"
                  data-testid="employee-form-telegram-user-id"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="employee-telegram-chat-id">Telegram chat id</Label>
                <Input
                  id="employee-telegram-chat-id"
                  name="telegramChatId"
                  data-testid="employee-form-telegram-chat-id"
                />
              </div>
              <div className="flex items-center gap-3 rounded-md border px-3 py-2 md:col-span-2">
                <input
                  id="employee-is-active"
                  name="isActive"
                  type="checkbox"
                  defaultChecked
                  value="true"
                  data-testid="employee-form-is-active"
                />
                <Label htmlFor="employee-is-active">Сотрудник активен в HR-справочнике</Label>
              </div>
              <div className="md:col-span-2 flex flex-wrap gap-2">
                <Button type="submit" data-testid="employee-create-submit">
                  Сохранить сотрудника
                </Button>
                <Button asChild type="button" variant="outline">
                  <a href="/hr/employees">Отмена</a>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </InternalAppShell>
  );
}
