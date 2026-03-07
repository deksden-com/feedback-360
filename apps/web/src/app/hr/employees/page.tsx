import { InternalAppShell } from "@/components/internal-app-shell";
import {
  InlineBanner,
  PageEmptyState,
  PageErrorState,
  PageStateScreen,
} from "@/components/page-state";
import { Avatar, AvatarLabel } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyDebugPageDelay } from "@/lib/debug-page-delay";
import { resolveAppOperationContext } from "@/lib/operation-context";
import { getFriendlyErrorCopy } from "@/lib/page-state";
import { createInprocClient } from "@feedback-360/client";
import { redirect } from "next/navigation";

import {
  getBadgeClassName,
  getDisplayInitials,
  getEmployeeDisplayName,
  getEmployeeStatusBadges,
  getQueryValue,
  getRoleLabel,
} from "@/features/people-org/lib/people-org";

const statuses = [
  { value: "all", label: "Все" },
  { value: "active", label: "Активные" },
  { value: "inactive", label: "Неактивные" },
  { value: "deleted", label: "Soft deleted" },
] as const;

/**
 * Employee directory for HR roles.
 * @screenId SCR-HR-EMPLOYEES
 * @testIdScope scr-hr-employees
 */
export default async function HrEmployeesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  await applyDebugPageDelay(params.debugDelayMs);
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
      title: "Не удалось открыть справочник сотрудников",
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

  const isHrRole = resolved.context.role === "hr_admin" || resolved.context.role === "hr_reader";
  if (!isHrRole) {
    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/hr/employees"
        title="Сотрудники"
        subtitle="Раздел доступен только для ролей HR Admin и HR Reader."
      >
        <PageErrorState
          title="Раздел доступен только HR-роли"
          description="Переключите активную компанию или откройте личные рабочие разделы."
          actions={[{ href: "/", label: "Вернуться на главную", variant: "outline" }]}
        />
      </InternalAppShell>
    );
  }

  const search = getQueryValue(params.search);
  const departmentId = getQueryValue(params.departmentId);
  const status = getQueryValue(params.status) ?? "all";
  const flash = getQueryValue(params.flash);

  const client = createInprocClient();
  const [directory, departments] = await Promise.all([
    client.employeeDirectoryList(
      {
        ...(search ? { search } : {}),
        ...(departmentId ? { departmentId } : {}),
        status:
          status === "active" || status === "inactive" || status === "deleted" ? status : "all",
      },
      resolved.context,
    ),
    client.departmentList({ includeInactive: true }, resolved.context),
  ]);

  if (!directory.ok || !departments.ok) {
    const error = !directory.ok ? directory.error : departments.ok ? undefined : departments.error;
    if (!error) {
      redirect("/");
    }
    const state = getFriendlyErrorCopy(error, {
      title: "Не удалось загрузить справочник сотрудников",
      description: "Данные сотрудников или подразделений временно недоступны.",
    });

    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/hr/employees"
        title="Сотрудники"
        subtitle="Каталог сотрудников, статусы, контакты и быстрый переход в профиль."
      >
        <PageErrorState
          title={state.title}
          description={state.description}
          actions={[{ href: "/", label: "Вернуться на главную", variant: "outline" }]}
        />
      </InternalAppShell>
    );
  }

  const filteredCount = directory.data.items.length;
  const activeCount = directory.data.items.filter((employee) => employee.isActive).length;
  const departmentCount = new Set(
    directory.data.items.map((employee) => employee.departmentId).filter(Boolean),
  ).size;

  return (
    <InternalAppShell
      context={resolved.context}
      currentPath="/hr/employees"
      title="Сотрудники"
      subtitle="Справочник сотрудников, статусы, контакты и переход в профиль/оргструктуру."
    >
      <div className="space-y-5" data-testid="scr-hr-employees-root">
        {flash === "saved" ? (
          <InlineBanner
            description="Профиль сотрудника сохранён."
            tone="success"
            testId="employees-flash-saved"
          />
        ) : flash === "provisioned" ? (
          <InlineBanner
            description="Доступ и роль сотрудника обновлены."
            tone="success"
            testId="employees-flash-provisioned"
          />
        ) : null}

        <Card className="overflow-hidden border-border/80 shadow-sm">
          <CardHeader className="gap-4 border-b bg-muted/25">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <CardTitle className="text-2xl">Справочник сотрудников</CardTitle>
                <CardDescription className="max-w-3xl">
                  Рабочее место HR для поиска, открытия и сопровождения сотрудников в активной
                  компании. Сначала человек и оргконтекст, потом служебные действия.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2" data-testid="scr-hr-employees-toolbar">
                {resolved.context.role === "hr_admin" ? (
                  <Button asChild data-testid="employee-directory-create">
                    <a href="/hr/employees/new" data-testid="scr-hr-employees-create">
                      Добавить сотрудника
                    </a>
                  </Button>
                ) : null}
                <Button asChild variant="outline">
                  <a href="/hr/org">Открыть оргструктуру</a>
                </Button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-border/80 bg-background p-4">
                <p className="text-sm text-muted-foreground">В выборке</p>
                <p className="mt-2 text-3xl font-semibold">{filteredCount}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Сотрудники после текущих фильтров и поиска.
                </p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-background p-4">
                <p className="text-sm text-muted-foreground">Активные записи</p>
                <p className="mt-2 text-3xl font-semibold">{activeCount}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Доступны для кампаний и ручного HR сопровождения.
                </p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-background p-4">
                <p className="text-sm text-muted-foreground">Подразделения в выборке</p>
                <p className="mt-2 text-3xl font-semibold">{departmentCount}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Быстрый переход к оргструктуре остаётся рядом.
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Фильтры</CardTitle>
            <CardDescription>
              Ищите по имени, email, должности или руководителю и сужайте выборку по отделу и
              статусу.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-end"
              method="get"
              data-testid="scr-hr-employees-filters"
            >
              <div className="grid gap-2">
                <Label htmlFor="employee-search">Поиск</Label>
                <Input
                  id="employee-search"
                  name="search"
                  defaultValue={search ?? ""}
                  placeholder="Имя, email, телефон, должность…"
                  data-testid="employee-directory-search"
                  data-slot="search"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="employee-department">Подразделение</Label>
                <select
                  id="employee-department"
                  name="departmentId"
                  defaultValue={departmentId ?? ""}
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  data-testid="employee-directory-department-filter"
                >
                  <option value="">Все подразделения</option>
                  {departments.data.items.map((department) => (
                    <option key={department.departmentId} value={department.departmentId}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="employee-status">Статус</Label>
                <select
                  id="employee-status"
                  name="status"
                  defaultValue={status}
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  data-testid="employee-directory-status-filter"
                >
                  {statuses.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" data-testid="employee-directory-apply">
                  Применить
                </Button>
                <Button asChild type="button" variant="outline">
                  <a href="/hr/employees">Сбросить</a>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {directory.data.items.length === 0 ? (
          <PageEmptyState
            title="Сотрудники не найдены"
            description="Измените фильтры или добавьте нового сотрудника в справочник."
            actions={
              resolved.context.role === "hr_admin"
                ? [{ href: "/hr/employees/new", label: "Добавить сотрудника", variant: "outline" }]
                : [{ href: "/hr/org", label: "Открыть оргструктуру", variant: "outline" }]
            }
            testId="employee-directory-empty"
          />
        ) : (
          <div className="grid gap-4">
            {directory.data.items.map((employee) => (
              <Card
                key={employee.employeeId}
                className="border-border/80 shadow-sm"
                data-testid={`employee-row-${employee.employeeId}`}
              >
                <CardHeader className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-4">
                      <Avatar className="size-12 rounded-2xl bg-primary/10 text-primary">
                        <AvatarLabel>
                          {getDisplayInitials(getEmployeeDisplayName(employee))}
                        </AvatarLabel>
                      </Avatar>
                      <div className="min-w-0 space-y-1">
                        <CardTitle className="truncate text-lg">
                          {getEmployeeDisplayName(employee)}
                        </CardTitle>
                        <CardDescription className="truncate">{employee.email}</CardDescription>
                        <p className="text-sm text-muted-foreground">
                          {[employee.positionTitle, employee.departmentName]
                            .filter(Boolean)
                            .join(" · ") || "Должность и подразделение появятся после назначения"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getEmployeeStatusBadges(employee).map((badge) => (
                        <span
                          key={`${employee.employeeId}:${badge.label}`}
                          className={`rounded-full border px-3 py-1 text-xs ${getBadgeClassName(badge.tone)}`}
                        >
                          {badge.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                  <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-border/70 bg-muted/15 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Подразделение
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {employee.departmentName ?? "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/15 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Руководитель
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {employee.managerName ?? "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/15 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Должность
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {employee.positionTitle ?? "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/15 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Доступ
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {getRoleLabel(employee.membershipRole) ?? "Нет доступа"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                      <a href={`/hr/org?employeeId=${employee.employeeId}`}>В оргструктуру</a>
                    </Button>
                    <Button asChild data-testid={`employee-open-${employee.employeeId}`}>
                      <a
                        href={`/hr/employees/${employee.employeeId}`}
                        data-testid={`scr-hr-employees-row-open-${employee.employeeId}`}
                      >
                        Открыть профиль
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </InternalAppShell>
  );
}
