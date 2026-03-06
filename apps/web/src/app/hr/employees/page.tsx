import { InternalAppShell } from "@/components/internal-app-shell";
import {
  InlineBanner,
  PageEmptyState,
  PageErrorState,
  PageStateScreen,
} from "@/components/page-state";
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

  return (
    <InternalAppShell
      context={resolved.context}
      currentPath="/hr/employees"
      title="Сотрудники"
      subtitle="Справочник сотрудников, статусы, контакты и переход в профиль/оргструктуру."
    >
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

      <div className="flex flex-wrap gap-2">
        {resolved.context.role === "hr_admin" ? (
          <Button asChild data-testid="employee-directory-create">
            <a href="/hr/employees/new">Добавить сотрудника</a>
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <a href="/hr/org">Открыть оргструктуру</a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Фильтры</CardTitle>
          <CardDescription>
            Ищите по имени, email, должности или руководителю и сужайте выборку по отделу и статусу.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-end" method="get">
            <div className="grid gap-2">
              <Label htmlFor="employee-search">Поиск</Label>
              <Input
                id="employee-search"
                name="search"
                defaultValue={search ?? ""}
                placeholder="Имя, email, телефон, должность…"
                data-testid="employee-directory-search"
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
            <Card key={employee.employeeId} data-testid={`employee-row-${employee.employeeId}`}>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{getEmployeeDisplayName(employee)}</CardTitle>
                    <CardDescription>{employee.email}</CardDescription>
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
              <CardContent className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                  <p>
                    Подразделение:{" "}
                    <span className="font-medium text-foreground">
                      {employee.departmentName ?? "—"}
                    </span>
                  </p>
                  <p>
                    Руководитель:{" "}
                    <span className="font-medium text-foreground">
                      {employee.managerName ?? "—"}
                    </span>
                  </p>
                  <p>
                    Должность:{" "}
                    <span className="font-medium text-foreground">
                      {employee.positionTitle ?? "—"}
                    </span>
                  </p>
                  <p>
                    Роль:{" "}
                    <span className="font-medium text-foreground">
                      {getRoleLabel(employee.membershipRole) ?? "Нет доступа"}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <a href={`/hr/org?employeeId=${employee.employeeId}`}>В оргструктуру</a>
                  </Button>
                  <Button asChild data-testid={`employee-open-${employee.employeeId}`}>
                    <a href={`/hr/employees/${employee.employeeId}`}>Открыть профиль</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </InternalAppShell>
  );
}
