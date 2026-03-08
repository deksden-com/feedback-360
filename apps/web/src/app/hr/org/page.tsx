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
import { resolveAppOperationContext } from "@/lib/operation-context";
import { getFriendlyErrorCopy } from "@/lib/page-state";
import { createInprocClient } from "@feedback-360/client";
import { redirect } from "next/navigation";

import {
  buildDepartmentTree,
  getBadgeClassName,
  getDisplayInitials,
  getEmployeeDisplayName,
  getEmployeeStatusBadges,
  getQueryValue,
} from "@/features/people-org/lib/people-org";

/**
 * HR organization structure editor.
 * @screenId SCR-HR-ORG
 * @testIdScope scr-hr-org
 */
export default async function HrOrgPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const selectedEmployeeId = getQueryValue(params.employeeId);
  const selectedDepartmentId = getQueryValue(params.departmentId);
  const flash = getQueryValue(params.flash);

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
      title: "Не удалось открыть оргструктуру",
      description: "Попробуйте обновить страницу или войти заново.",
    });

    return (
      <PageStateScreen>
        <PageErrorState title={state.title} description={state.description} />
      </PageStateScreen>
    );
  }

  const isHrRole = resolved.context.role === "hr_admin" || resolved.context.role === "hr_reader";
  if (!isHrRole) {
    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/hr/org"
        title="Оргструктура"
        subtitle="Раздел доступен только для ролей HR Admin и HR Reader."
      >
        <PageErrorState
          title="Недостаточно прав"
          description="Откройте разделы, доступные вашей роли, или переключите компанию."
          actions={[{ href: "/", label: "Вернуться на главную", variant: "outline" }]}
        />
      </InternalAppShell>
    );
  }

  const client = createInprocClient();
  const [departments, directory] = await Promise.all([
    client.departmentList({ includeInactive: true }, resolved.context),
    client.employeeDirectoryList({ status: "all" }, resolved.context),
  ]);

  if (!departments.ok || !directory.ok) {
    const error = !departments.ok ? departments.error : directory.ok ? undefined : directory.error;
    if (!error) {
      redirect("/hr/employees");
    }
    const state = getFriendlyErrorCopy(error, {
      title: "Не удалось загрузить оргструктуру",
      description: "Подразделения или сотрудники временно недоступны.",
    });

    return (
      <InternalAppShell
        context={resolved.context}
        currentPath="/hr/org"
        title="Оргструктура"
        subtitle="Дерево подразделений, руководители и перемещения сотрудников."
      >
        <PageErrorState
          title={state.title}
          description={state.description}
          actions={[{ href: "/hr/employees", label: "К справочнику", variant: "outline" }]}
        />
      </InternalAppShell>
    );
  }

  const departmentTree = buildDepartmentTree(departments.data.items);
  const selectedEmployee =
    directory.data.items.find((item) => item.employeeId === selectedEmployeeId) ??
    directory.data.items[0];
  const selectedDepartment =
    departments.data.items.find((item) => item.departmentId === selectedDepartmentId) ??
    departments.data.items[0];
  const selectedDepartmentParent = selectedDepartment?.parentDepartmentId
    ? departments.data.items.find(
        (item) => item.departmentId === selectedDepartment.parentDepartmentId,
      )
    : undefined;
  const departmentMembers = selectedDepartment
    ? directory.data.items.filter((item) => item.departmentId === selectedDepartment.departmentId)
    : [];

  return (
    <InternalAppShell
      context={resolved.context}
      currentPath="/hr/org"
      title="Оргструктура"
      subtitle="Дерево подразделений, guided move flow и актуальное состояние сотрудников."
    >
      <div className="space-y-5" data-testid="scr-hr-org-root">
        {flash === "department-saved" ? (
          <InlineBanner
            description="Изменения подразделения сохранены."
            tone="success"
            testId="org-flash-department-saved"
          />
        ) : flash === "moved" ? (
          <InlineBanner
            description="Сотрудник перемещён в подразделение."
            tone="success"
            testId="org-flash-moved"
          />
        ) : flash === "manager" ? (
          <InlineBanner
            description="Руководитель обновлён."
            tone="success"
            testId="org-flash-manager"
          />
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_320px]">
          <Card className="overflow-hidden rounded-[2rem] border-0 bg-[#2563eb] text-white shadow-[0_20px_50px_-24px_rgba(37,99,235,0.9)]">
            <CardContent className="relative p-8 md:p-10">
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center rounded-full bg-white/12 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-white/80">
                  Organization Design
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                    Иерархия подразделений должна читаться с первого взгляда
                  </h2>
                  <p className="max-w-xl text-sm leading-6 text-white/80 md:text-base">
                    Слева — дерево подразделений, справа — контекст выбранного узла и move flow для
                    сотрудников. Это основной источник структуры для кампаний и матрицы.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {resolved.context.role === "hr_admin" ? (
                    <Button
                      asChild
                      size="lg"
                      className="rounded-xl bg-white px-5 text-primary shadow-none hover:bg-white/90"
                    >
                      <a href="/hr/employees/new">Добавить сотрудника</a>
                    </Button>
                  ) : null}
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-xl border-white/20 bg-white/10 px-5 text-white hover:bg-white/15 hover:text-white"
                  >
                    <a href="/hr/employees">К справочнику</a>
                  </Button>
                </div>
              </div>
              <div className="absolute right-6 top-6 hidden h-36 w-36 rounded-[2rem] bg-white/10 lg:block" />
              <div className="absolute bottom-6 right-8 hidden h-24 w-24 rounded-[1.5rem] border border-white/10 bg-white/8 lg:block" />
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[1.75rem] border border-border/70 bg-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Подразделений
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {departments.data.items.length}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Всего узлов в иерархии active company.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-border/70 bg-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Сотрудников
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {directory.data.items.length}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Актуальное HR-состояние во всей компании.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-border/70 bg-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                В выбранном узле
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {selectedDepartment?.memberCount ?? 0}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Сотрудники, которых видит текущий узел.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <Card
            className="rounded-[1.75rem] border-border/70 shadow-sm"
            data-testid="org-tree-card"
          >
            <CardHeader>
              <CardTitle className="text-2xl font-semibold tracking-tight">
                Дерево подразделений
              </CardTitle>
              <CardDescription>
                Иерархия departments внутри active company с числом сотрудников и быстрым входом в
                detail view.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {departmentTree.length === 0 ? (
                <PageEmptyState
                  title="Подразделения не заведены"
                  description="Создайте первое подразделение, чтобы начать работу с оргструктурой."
                  testId="org-tree-empty"
                />
              ) : (
                departmentTree.map((department) => (
                  <div
                    key={department.departmentId}
                    className={`rounded-[1.5rem] border p-4 transition ${
                      department.departmentId === selectedDepartment?.departmentId
                        ? "border-primary/25 bg-primary/5 shadow-sm"
                        : "border-border/70 bg-background"
                    }`}
                    style={{ marginLeft: `${department.depth * 20}px` }}
                    data-testid={`org-tree-row-${department.departmentId}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-semibold">{department.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Сотрудников: {department.memberCount}
                        </p>
                      </div>
                      <Button asChild variant="outline" className="rounded-xl">
                        <a
                          href={`/hr/org?departmentId=${department.departmentId}${selectedEmployee ? `&employeeId=${selectedEmployee.employeeId}` : ""}`}
                        >
                          Открыть
                        </a>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card
              className="rounded-[1.75rem] border-border/70 shadow-sm"
              data-testid="scr-hr-org-selected-department"
            >
              <CardHeader>
                <CardTitle className="text-xl">Выбранное подразделение</CardTitle>
                <CardDescription>
                  Текущий узел оргструктуры и контекст для редактора и списка сотрудников.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-border/80 bg-background p-4">
                  <p className="text-sm text-muted-foreground">Название</p>
                  <p className="mt-2 text-lg font-semibold">{selectedDepartment?.name ?? "—"}</p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-background p-4">
                  <p className="text-sm text-muted-foreground">Родитель</p>
                  <p className="mt-2 text-lg font-semibold">
                    {selectedDepartmentParent?.name ?? "Корневой уровень"}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-background p-4">
                  <p className="text-sm text-muted-foreground">Сотрудников</p>
                  <p className="mt-2 text-lg font-semibold">
                    {selectedDepartment?.memberCount ?? 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Редактор подразделения</CardTitle>
                <CardDescription>
                  Создайте новый отдел или обновите имя/родителя существующего.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {resolved.context.role === "hr_admin" ? (
                  <form
                    action="/api/hr/departments/upsert"
                    method="post"
                    className="grid gap-4"
                    data-testid="department-upsert-form"
                  >
                    <input
                      type="hidden"
                      name="departmentId"
                      value={selectedDepartment?.departmentId ?? crypto.randomUUID()}
                    />
                    <input
                      type="hidden"
                      name="returnTo"
                      value={`/hr/org${selectedEmployee ? `?employeeId=${selectedEmployee.employeeId}` : ""}`}
                    />
                    <div className="grid gap-2">
                      <Label htmlFor="department-name">Название</Label>
                      <Input
                        id="department-name"
                        name="name"
                        defaultValue={selectedDepartment?.name ?? ""}
                        required
                        data-testid="department-name-input"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="department-parent-id">Родитель</Label>
                      <select
                        id="department-parent-id"
                        name="parentDepartmentId"
                        defaultValue={selectedDepartment?.parentDepartmentId ?? ""}
                        className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                        data-testid="department-parent-select"
                      >
                        <option value="">Корневой уровень</option>
                        {departments.data.items
                          .filter((item) => item.departmentId !== selectedDepartment?.departmentId)
                          .map((department) => (
                            <option key={department.departmentId} value={department.departmentId}>
                              {department.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-3 rounded-md border px-3 py-2">
                      <input
                        id="department-is-active"
                        name="isActive"
                        type="checkbox"
                        defaultChecked={selectedDepartment?.isActive ?? true}
                        value="true"
                      />
                      <Label htmlFor="department-is-active">Подразделение активно</Label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" data-testid="department-save-submit">
                        Сохранить подразделение
                      </Button>
                      <Button asChild type="button" variant="outline">
                        <a href="/hr/org">Новый отдел</a>
                      </Button>
                    </div>
                  </form>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    HR Reader видит оргструктуру в read-only режиме.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Сотрудники подразделения</CardTitle>
              <CardDescription>
                Выберите сотрудника, чтобы переместить его, назначить руководителя или открыть
                подробный профиль.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3" data-testid="org-members-card">
              {departmentMembers.length === 0 ? (
                <PageEmptyState
                  title="В подразделении пока нет сотрудников"
                  description="Выберите другое подразделение или переместите сюда сотрудника."
                  testId="org-members-empty"
                />
              ) : (
                departmentMembers.map((employee) => (
                  <div
                    key={employee.employeeId}
                    className="rounded-2xl border border-border/80 p-3"
                    data-testid={`org-member-${employee.employeeId}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-3">
                        <Avatar className="size-11 rounded-2xl bg-primary/10 text-primary">
                          <AvatarLabel>
                            {getDisplayInitials(getEmployeeDisplayName(employee))}
                          </AvatarLabel>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium">{getEmployeeDisplayName(employee)}</p>
                          <p className="text-sm text-muted-foreground">
                            {employee.positionTitle ?? employee.email}
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
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button asChild variant="outline">
                        <a
                          href={`/hr/org?departmentId=${selectedDepartment?.departmentId ?? ""}&employeeId=${employee.employeeId}`}
                        >
                          Выбрать
                        </a>
                      </Button>
                      <Button asChild>
                        <a href={`/hr/employees/${employee.employeeId}`}>Открыть профиль</a>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Выбранный сотрудник</CardTitle>
              <CardDescription>
                Guided org actions поверх текущего профиля сотрудника.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedEmployee ? (
                <>
                  <div
                    className="rounded-2xl border border-border/80 bg-muted/20 p-4"
                    data-testid="org-selected-employee-card"
                  >
                    <p className="font-medium">{getEmployeeDisplayName(selectedEmployee)}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedEmployee.departmentName ?? "Без подразделения"} ·{" "}
                      {selectedEmployee.managerName ?? "Без руководителя"}
                    </p>
                  </div>

                  {resolved.context.role === "hr_admin" ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <form
                        action="/api/hr/org/move"
                        method="post"
                        className="grid gap-3 rounded-lg border p-4"
                        data-testid="org-move-form"
                      >
                        <input
                          type="hidden"
                          name="employeeId"
                          value={selectedEmployee.employeeId}
                        />
                        <input
                          type="hidden"
                          name="returnTo"
                          value={`/hr/org?departmentId=${selectedDepartment?.departmentId ?? ""}&employeeId=${selectedEmployee.employeeId}`}
                        />
                        <Label htmlFor="org-move-department">Переместить в отдел</Label>
                        <select
                          id="org-move-department"
                          name="toDepartmentId"
                          defaultValue={
                            selectedEmployee.departmentId ?? selectedDepartment?.departmentId ?? ""
                          }
                          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                          data-testid="org-move-department-select"
                        >
                          {departments.data.items.map((department) => (
                            <option key={department.departmentId} value={department.departmentId}>
                              {department.name}
                            </option>
                          ))}
                        </select>
                        <Button type="submit" data-testid="org-move-submit">
                          Переместить
                        </Button>
                      </form>

                      <form
                        action="/api/hr/org/manager"
                        method="post"
                        className="grid gap-3 rounded-lg border p-4"
                        data-testid="org-manager-form"
                      >
                        <input
                          type="hidden"
                          name="employeeId"
                          value={selectedEmployee.employeeId}
                        />
                        <input
                          type="hidden"
                          name="returnTo"
                          value={`/hr/org?departmentId=${selectedDepartment?.departmentId ?? ""}&employeeId=${selectedEmployee.employeeId}`}
                        />
                        <Label htmlFor="org-manager-employee">Назначить руководителя</Label>
                        <select
                          id="org-manager-employee"
                          name="managerEmployeeId"
                          defaultValue={
                            selectedEmployee.managerEmployeeId ??
                            directory.data.items.find(
                              (item) => item.employeeId !== selectedEmployee.employeeId,
                            )?.employeeId ??
                            ""
                          }
                          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                          data-testid="org-manager-select"
                        >
                          {directory.data.items
                            .filter((item) => item.employeeId !== selectedEmployee.employeeId)
                            .map((employee) => (
                              <option key={employee.employeeId} value={employee.employeeId}>
                                {getEmployeeDisplayName(employee)}
                              </option>
                            ))}
                        </select>
                        <Button type="submit" data-testid="org-manager-submit">
                          Обновить руководителя
                        </Button>
                      </form>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Выберите сотрудника в списке подразделения.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </InternalAppShell>
  );
}
