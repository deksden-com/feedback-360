"use client";

import { useMemo, useState } from "react";

import { InlineBanner } from "@/components/page-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFriendlyErrorCopy } from "@/lib/page-state";
import type {
  CampaignGetOutput,
  DepartmentListItem,
  MatrixGenerateSuggestedOutput,
  MatrixListAssignment,
  MatrixSetOutput,
  MembershipRole,
  OperationError,
} from "@feedback-360/api-contract";

import {
  buildDepartmentOptions,
  getMatrixLockCopy,
  groupAssignmentsBySubject,
  matrixRoleLabels,
} from "../lib/models-matrix";

/**
 * HR campaign matrix builder and assignment editing surface.
 * @docs .memory-bank/spec/ui/screens/hr-campaign-matrix.md
 * @see .memory-bank/spec/domain/assignments-and-matrix.md
 */
type ActionResponse<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: OperationError;
    };

const emptyAssignment = (): MatrixListAssignment => ({
  subjectEmployeeId: "",
  raterEmployeeId: "",
  raterRole: "peer",
  source: "manual",
});

export const HrMatrixBuilder = ({
  role,
  campaign,
  employees,
  departments,
  initialAssignments,
}: {
  role: MembershipRole;
  campaign: CampaignGetOutput;
  employees: Array<{ employeeId: string; label: string }>;
  departments: DepartmentListItem[];
  initialAssignments: MatrixListAssignment[];
}) => {
  const [departmentIds, setDepartmentIds] = useState<string[]>([]);
  const [assignments, setAssignments] = useState<MatrixListAssignment[]>(initialAssignments);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<OperationError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canMutate =
    role === "hr_admin" &&
    !campaign.lockedAt &&
    (campaign.status === "draft" || campaign.status === "started");
  const peopleById = useMemo(
    () => new Map(employees.map((employee) => [employee.employeeId, employee.label])),
    [employees],
  );
  const groupedAssignments = useMemo(
    () => groupAssignmentsBySubject(assignments, peopleById),
    [assignments, peopleById],
  );
  const departmentOptions = useMemo(() => buildDepartmentOptions(departments), [departments]);
  const friendlyError = error
    ? getFriendlyErrorCopy(error, {
        title: "Не удалось обновить матрицу",
        description: "Проверьте состав участников и попробуйте ещё раз.",
      })
    : null;

  const execute = async <T,>(action: string, input: unknown): Promise<ActionResponse<T>> => {
    const response = await fetch("/api/hr/campaigns/execute", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        action,
        input,
      }),
    });

    return (await response.json()) as ActionResponse<T>;
  };

  const onGenerate = async () => {
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    const addParticipants = await execute<{ campaignId: string; totalParticipants: number }>(
      "campaign.participants.addFromDepartments",
      {
        campaignId: campaign.campaignId,
        departmentIds,
        includeSelf: true,
      },
    );

    if (!addParticipants.ok) {
      setError(addParticipants.error);
      setIsSubmitting(false);
      return;
    }

    const suggested = await execute<MatrixGenerateSuggestedOutput>("matrix.generateSuggested", {
      campaignId: campaign.campaignId,
      departmentIds,
    });
    setIsSubmitting(false);

    if (!suggested.ok) {
      setError(suggested.error);
      return;
    }

    setAssignments(
      suggested.data.generatedAssignments.map((assignment) => ({
        ...assignment,
        source: "auto" as const,
      })),
    );
    setMessage(
      `Матрица сгенерирована для ${addParticipants.data.totalParticipants} участников (${suggested.data.totalAssignments} назначений).`,
    );
  };

  const onSave = async () => {
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    const result = await execute<MatrixSetOutput>("matrix.set", {
      campaignId: campaign.campaignId,
      assignments: assignments.map(({ subjectEmployeeId, raterEmployeeId, raterRole }) => ({
        subjectEmployeeId,
        raterEmployeeId,
        raterRole,
      })),
    });
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setAssignments((current) => current.map((assignment) => ({ ...assignment, source: "manual" })));
    setMessage(`Матрица сохранена. Всего назначений: ${result.data.totalAssignments}.`);
  };

  return (
    <div className="space-y-4" data-testid="matrix-builder-root">
      <InlineBanner
        description={getMatrixLockCopy(campaign)}
        tone={canMutate ? "default" : "warning"}
        testId="matrix-builder-lock-banner"
      />
      {message ? (
        <InlineBanner description={message} tone="success" testId="matrix-builder-flash" />
      ) : null}
      {friendlyError ? (
        <InlineBanner
          title={friendlyError.title}
          description={friendlyError.description}
          tone="error"
          testId="matrix-builder-error"
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Автогенерация из оргструктуры</CardTitle>
          <CardDescription>
            Выберите одно или несколько подразделений: их сотрудники попадут в campaign
            participants, а матрица будет предложена по оргправилам.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {departmentOptions.length === 0 ? (
            <InlineBanner
              description="В активной компании пока нет подразделений для автогенерации."
              tone="warning"
            />
          ) : (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {departmentOptions.map((department: { departmentId: string; label: string }) => {
                const checked = departmentIds.includes(department.departmentId);
                return (
                  <label
                    key={department.departmentId}
                    className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!canMutate}
                      data-testid={`matrix-department-${department.departmentId}`}
                      onChange={(event) =>
                        setDepartmentIds((current) =>
                          event.target.checked
                            ? [...current, department.departmentId]
                            : current.filter((item) => item !== department.departmentId),
                        )
                      }
                    />
                    <span>{department.label}</span>
                  </label>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={!canMutate || departmentIds.length === 0 || isSubmitting}
              data-testid="matrix-generate"
              onClick={onGenerate}
            >
              {isSubmitting ? "Обновляем…" : "Сгенерировать матрицу"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!canMutate}
              data-testid="matrix-add-row"
              onClick={() => setAssignments((current) => [...current, emptyAssignment()])}
            >
              Добавить назначение вручную
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Назначения</CardTitle>
          <CardDescription>
            Проверяем, кто оценивает каждого участника. Роли и состав можно править только до lock
            кампании.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {assignments.length === 0 ? (
            <InlineBanner
              description="Матрица пока пуста. Сгенерируйте назначения по подразделениям или добавьте строки вручную."
              tone="warning"
              testId="matrix-empty"
            />
          ) : (
            <div className="space-y-4">
              {groupedAssignments.map((group) => (
                <div
                  key={group.subjectEmployeeId}
                  className="rounded-lg border p-4"
                  data-testid={`matrix-group-${group.subjectEmployeeId}`}
                >
                  <div className="mb-3">
                    <p className="text-sm text-muted-foreground">Оцениваемый сотрудник</p>
                    <p className="font-medium">{group.subjectLabel}</p>
                  </div>
                  <div className="space-y-2">
                    {group.rows.map((assignment) => {
                      const assignmentIndex = assignments.findIndex(
                        (item) =>
                          item.subjectEmployeeId === assignment.subjectEmployeeId &&
                          item.raterEmployeeId === assignment.raterEmployeeId &&
                          item.raterRole === assignment.raterRole,
                      );

                      return (
                        <div
                          key={`${assignment.subjectEmployeeId}:${assignment.raterEmployeeId}:${assignment.raterRole}`}
                          className="grid gap-2 rounded-md border p-3 md:grid-cols-[1fr_1fr_170px_110px_auto]"
                        >
                          <select
                            value={assignment.subjectEmployeeId}
                            disabled={!canMutate}
                            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                            data-testid={`matrix-subject-${assignmentIndex}`}
                            onChange={(event) =>
                              setAssignments((current) =>
                                current.map((item, index) =>
                                  index === assignmentIndex
                                    ? { ...item, subjectEmployeeId: event.target.value }
                                    : item,
                                ),
                              )
                            }
                          >
                            <option value="">Выберите сотрудника</option>
                            {employees.map((employee) => (
                              <option key={employee.employeeId} value={employee.employeeId}>
                                {employee.label}
                              </option>
                            ))}
                          </select>
                          <select
                            value={assignment.raterEmployeeId}
                            disabled={!canMutate}
                            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                            data-testid={`matrix-rater-${assignmentIndex}`}
                            onChange={(event) =>
                              setAssignments((current) =>
                                current.map((item, index) =>
                                  index === assignmentIndex
                                    ? { ...item, raterEmployeeId: event.target.value }
                                    : item,
                                ),
                              )
                            }
                          >
                            <option value="">Кто оценивает</option>
                            {employees.map((employee) => (
                              <option key={employee.employeeId} value={employee.employeeId}>
                                {employee.label}
                              </option>
                            ))}
                          </select>
                          <select
                            value={assignment.raterRole}
                            disabled={!canMutate}
                            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                            data-testid={`matrix-role-${assignmentIndex}`}
                            onChange={(event) =>
                              setAssignments((current) =>
                                current.map((item, index) =>
                                  index === assignmentIndex
                                    ? {
                                        ...item,
                                        raterRole: event.target
                                          .value as MatrixListAssignment["raterRole"],
                                        source: "manual",
                                      }
                                    : item,
                                ),
                              )
                            }
                          >
                            {Object.entries(matrixRoleLabels).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <div
                            className="flex items-center rounded-md border bg-muted/20 px-3 text-sm"
                            data-testid={`matrix-source-${assignmentIndex}`}
                          >
                            {assignment.source === "auto" ? "Auto" : "Manual"}
                          </div>
                          {canMutate ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              data-testid={`matrix-remove-${assignmentIndex}`}
                              onClick={() =>
                                setAssignments((current) =>
                                  current.filter((_, index) => index !== assignmentIndex),
                                )
                              }
                            >
                              Удалить
                            </Button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={!canMutate || assignments.length === 0 || isSubmitting}
              data-testid="matrix-save"
              onClick={onSave}
            >
              {isSubmitting ? "Сохраняем…" : "Сохранить матрицу"}
            </Button>
            <Button asChild variant="outline">
              <a href={`/hr/campaigns/${campaign.campaignId}`}>Вернуться к кампании</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
