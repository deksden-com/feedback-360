"use client";

import { InlineBanner } from "@/components/page-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFriendlyErrorCopy } from "@/lib/page-state";
import type {
  CampaignProgressGetOutput,
  EmployeeListActiveOutput,
  MatrixGeneratedAssignment,
  MembershipRole,
  OperationError,
} from "@feedback-360/api-contract";
import { useCallback, useEffect, useMemo, useState } from "react";

type HrCampaignAction =
  | "campaign.create"
  | "campaign.start"
  | "campaign.stop"
  | "campaign.end"
  | "campaign.progress.get"
  | "campaign.weights.set"
  | "campaign.participants.add"
  | "campaign.participants.remove"
  | "campaign.participants.addFromDepartments"
  | "campaign.snapshot.list"
  | "matrix.generateSuggested"
  | "matrix.set"
  | "ai.runForCampaign"
  | "employee.listActive";

type ActionResponse<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: OperationError;
    };

const splitCsv = (value: string): string[] => {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const safeStringify = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const defaultIsoEndAt = "2026-01-30T18:00:00.000Z";
const defaultIsoStartAt = "2026-01-15T09:00:00.000Z";

export const HrCampaignWorkbench = ({
  role,
  initialCampaignId,
}: {
  role: MembershipRole;
  initialCampaignId?: string;
}) => {
  const canMutate = role === "hr_admin";
  const [campaignId, setCampaignId] = useState(initialCampaignId ?? "");
  const [modelVersionId, setModelVersionId] = useState("");
  const [campaignName, setCampaignName] = useState("HR campaign");
  const [startAt, setStartAt] = useState(defaultIsoStartAt);
  const [endAt, setEndAt] = useState(defaultIsoEndAt);
  const [timezone, setTimezone] = useState("Europe/Kaliningrad");
  const [participantsToAdd, setParticipantsToAdd] = useState("");
  const [participantsToRemove, setParticipantsToRemove] = useState("");
  const [departmentIds, setDepartmentIds] = useState("");
  const [weights, setWeights] = useState({
    manager: "40",
    peers: "30",
    subordinates: "30",
  });
  const [matrixJson, setMatrixJson] = useState("[]");
  const [progress, setProgress] = useState<CampaignProgressGetOutput | null>(null);
  const [employees, setEmployees] = useState<EmployeeListActiveOutput["items"]>([]);
  const [generatedAssignments, setGeneratedAssignments] = useState<MatrixGeneratedAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<OperationError | null>(null);

  const isLocked = Boolean(progress?.campaignLockedAt);

  const pendingCount = useMemo(() => {
    if (!progress) {
      return 0;
    }
    return progress.statusCounts.notStarted + progress.statusCounts.inProgress;
  }, [progress]);
  const friendlyError = error
    ? getFriendlyErrorCopy(error, {
        title: "Не удалось выполнить действие",
        description: "Проверьте параметры формы и попробуйте снова.",
      })
    : null;

  const execute = useCallback(
    async <T,>(action: HrCampaignAction, input: unknown): Promise<ActionResponse<T>> => {
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

      const payload = (await response.json()) as ActionResponse<T>;
      if (!payload.ok) {
        setError(payload.error);
        setMessage("");
        return payload;
      }

      setError(null);
      return payload;
    },
    [],
  );

  const loadEmployees = useCallback(async () => {
    const result = await execute<EmployeeListActiveOutput>("employee.listActive", {});
    if (!result.ok) {
      return;
    }
    setEmployees(result.data.items);
  }, [execute]);

  const loadProgress = useCallback(
    async (targetCampaignId: string) => {
      if (!targetCampaignId) {
        return;
      }

      setIsLoading(true);
      const result = await execute<CampaignProgressGetOutput>("campaign.progress.get", {
        campaignId: targetCampaignId,
      });
      setIsLoading(false);

      if (!result.ok) {
        return;
      }

      setProgress(result.data);
      setMessage("Прогресс кампании обновлён.");
    },
    [execute],
  );

  useEffect(() => {
    void loadEmployees();
    if (initialCampaignId) {
      void loadProgress(initialCampaignId);
    }
  }, [initialCampaignId, loadEmployees, loadProgress]);

  const onCreateCampaign = async () => {
    if (!canMutate) {
      return;
    }

    const result = await execute<{
      campaignId: string;
      name: string;
    }>("campaign.create", {
      modelVersionId,
      name: campaignName,
      startAt,
      endAt,
      timezone,
    });
    if (!result.ok) {
      return;
    }

    setCampaignId(result.data.campaignId);
    setMessage(`Кампания создана: ${result.data.campaignId}`);
    await loadProgress(result.data.campaignId);
  };

  const onTransition = async (action: "campaign.start" | "campaign.stop" | "campaign.end") => {
    if (!campaignId) {
      return;
    }

    const result = await execute<{
      status: string;
      previousStatus: string;
    }>(action, {
      campaignId,
    });
    if (!result.ok) {
      return;
    }

    setMessage(`Статус кампании: ${result.data.previousStatus} → ${result.data.status}`);
    await loadProgress(campaignId);
  };

  const onUpdateWeights = async () => {
    if (!campaignId) {
      return;
    }

    const result = await execute<{
      changed: boolean;
      manager: number;
      peers: number;
      subordinates: number;
    }>("campaign.weights.set", {
      campaignId,
      manager: Number(weights.manager),
      peers: Number(weights.peers),
      subordinates: Number(weights.subordinates),
    });
    if (!result.ok) {
      return;
    }

    setMessage(
      `Веса обновлены: manager=${result.data.manager}, peers=${result.data.peers}, subordinates=${result.data.subordinates}.`,
    );
    await loadProgress(campaignId);
  };

  const onParticipantsMutation = async (
    action: "campaign.participants.add" | "campaign.participants.remove",
    csv: string,
  ) => {
    if (!campaignId) {
      return;
    }

    const employeeIds = splitCsv(csv);
    if (employeeIds.length === 0) {
      setError({
        code: "invalid_input",
        message: "Укажите хотя бы один employeeId.",
      });
      setMessage("");
      return;
    }

    const result = await execute<{
      changedEmployeeIds: string[];
      totalParticipants: number;
    }>(action, {
      campaignId,
      employeeIds,
    });
    if (!result.ok) {
      return;
    }

    setMessage(
      `Участники обновлены. Изменено: ${result.data.changedEmployeeIds.length}, всего: ${result.data.totalParticipants}.`,
    );
  };

  const onAddFromDepartments = async () => {
    if (!campaignId) {
      return;
    }

    const parsedDepartmentIds = splitCsv(departmentIds);
    if (parsedDepartmentIds.length === 0) {
      setError({
        code: "invalid_input",
        message: "Укажите хотя бы один departmentId.",
      });
      setMessage("");
      return;
    }

    const result = await execute<{
      addedEmployeeIds: string[];
      totalParticipants: number;
    }>("campaign.participants.addFromDepartments", {
      campaignId,
      departmentIds: parsedDepartmentIds,
      includeSelf: true,
    });
    if (!result.ok) {
      return;
    }

    setMessage(
      `Добавлено из отделов: ${result.data.addedEmployeeIds.length}, всего участников: ${result.data.totalParticipants}.`,
    );
  };

  const onGenerateMatrix = async () => {
    if (!campaignId) {
      return;
    }

    const parsedDepartmentIds = splitCsv(departmentIds);
    const result = await execute<{
      generatedAssignments: MatrixGeneratedAssignment[];
      totalAssignments: number;
    }>("matrix.generateSuggested", {
      campaignId,
      ...(parsedDepartmentIds.length > 0 ? { departmentIds: parsedDepartmentIds } : {}),
    });
    if (!result.ok) {
      return;
    }

    setGeneratedAssignments(result.data.generatedAssignments);
    setMatrixJson(safeStringify(result.data.generatedAssignments));
    setMessage(`Сгенерировано назначений: ${result.data.totalAssignments}.`);
  };

  const onApplyMatrix = async () => {
    if (!campaignId) {
      return;
    }

    let assignments: MatrixGeneratedAssignment[];
    try {
      const parsed = JSON.parse(matrixJson) as unknown;
      if (!Array.isArray(parsed)) {
        throw new Error("Assignments JSON must be an array.");
      }
      assignments = parsed as MatrixGeneratedAssignment[];
    } catch (parseError) {
      setError({
        code: "invalid_input",
        message: parseError instanceof Error ? parseError.message : "Некорректный JSON матрицы.",
      });
      setMessage("");
      return;
    }

    const result = await execute<{
      totalAssignments: number;
    }>("matrix.set", {
      campaignId,
      assignments,
    });
    if (!result.ok) {
      return;
    }

    setMessage(`Матрица сохранена. Назначений: ${result.data.totalAssignments}.`);
  };

  const onRetryAi = async () => {
    if (!campaignId) {
      return;
    }

    const result = await execute<{
      status: string;
      aiJobId: string;
      wasAlreadyCompleted: boolean;
    }>("ai.runForCampaign", {
      campaignId,
    });
    if (!result.ok) {
      return;
    }

    setMessage(
      `AI job: ${result.data.aiJobId}, status: ${result.data.status}, alreadyCompleted=${String(result.data.wasAlreadyCompleted)}.`,
    );
  };

  return (
    <div className="space-y-4" data-testid="hr-campaign-workbench">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Контекст кампании</CardTitle>
          <CardDescription>Откройте кампанию по ID или создайте новую (HR Admin).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="campaignId">Campaign ID</Label>
            <Input
              id="campaignId"
              value={campaignId}
              onChange={(event) => setCampaignId(event.target.value)}
              placeholder="19000000-..."
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => loadProgress(campaignId)}
              disabled={!campaignId || isLoading}
              data-testid="load-campaign-progress"
            >
              Обновить прогресс
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onTransition("campaign.start")}
              disabled={!campaignId || !canMutate}
              data-testid="campaign-start-button"
            >
              Start
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onTransition("campaign.stop")}
              disabled={!campaignId || !canMutate}
              data-testid="campaign-stop-button"
            >
              Stop
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onTransition("campaign.end")}
              disabled={!campaignId || !canMutate}
              data-testid="campaign-end-button"
            >
              End
            </Button>
            <Button
              type="button"
              onClick={onRetryAi}
              disabled={!campaignId || !canMutate}
              data-testid="campaign-ai-retry-button"
            >
              Retry AI
            </Button>
          </div>
          <p className="text-sm text-muted-foreground" data-testid="campaign-lock-state">
            Lock: {progress?.campaignLockedAt ? progress.campaignLockedAt : "not_locked"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Создать кампанию</CardTitle>
          <CardDescription>
            Для create нужны `name`, `modelVersionId`, `startAt`, `endAt`.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="createCampaignName">Название</Label>
            <Input
              id="createCampaignName"
              value={campaignName}
              onChange={(event) => setCampaignName(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="createCampaignModelVersionId">Model version ID</Label>
            <Input
              id="createCampaignModelVersionId"
              value={modelVersionId}
              onChange={(event) => setModelVersionId(event.target.value)}
              placeholder="21000000-..."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="createCampaignStartAt">Start at (ISO)</Label>
            <Input
              id="createCampaignStartAt"
              value={startAt}
              onChange={(event) => setStartAt(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="createCampaignEndAt">End at (ISO)</Label>
            <Input
              id="createCampaignEndAt"
              value={endAt}
              onChange={(event) => setEndAt(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="createCampaignTimezone">Timezone</Label>
            <Input
              id="createCampaignTimezone"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
            />
          </div>
          <div>
            <Button
              type="button"
              onClick={onCreateCampaign}
              disabled={!canMutate}
              data-testid="create-campaign-button"
            >
              Создать кампанию
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Участники и матрица</CardTitle>
          <CardDescription>Генерация и ручное редактирование до lock.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="departmentIds">Department IDs (csv)</Label>
            <Input
              id="departmentIds"
              value={departmentIds}
              onChange={(event) => setDepartmentIds(event.target.value)}
              placeholder="14000000-...,14000000-..."
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onAddFromDepartments}
              disabled={!campaignId || !canMutate}
              data-testid="participants-add-from-departments"
            >
              Add from departments
            </Button>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="participantsAdd">Add participants (employee IDs csv)</Label>
            <Input
              id="participantsAdd"
              value={participantsToAdd}
              onChange={(event) => setParticipantsToAdd(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="participantsRemove">Remove participants (employee IDs csv)</Label>
            <Input
              id="participantsRemove"
              value={participantsToRemove}
              onChange={(event) => setParticipantsToRemove(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onParticipantsMutation("campaign.participants.add", participantsToAdd)}
              disabled={!campaignId || !canMutate}
              data-testid="participants-add-button"
            >
              Add participants
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onParticipantsMutation("campaign.participants.remove", participantsToRemove)
              }
              disabled={!campaignId || !canMutate}
              data-testid="participants-remove-button"
            >
              Remove participants
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onGenerateMatrix}
              disabled={!campaignId || !canMutate || isLocked}
              data-testid="matrix-generate-button"
            >
              Generate suggested matrix
            </Button>
            <Button
              type="button"
              onClick={onApplyMatrix}
              disabled={!campaignId || !canMutate || isLocked}
              data-testid="matrix-apply-button"
            >
              Apply matrix JSON
            </Button>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="matrixJson">Matrix assignments JSON</Label>
            <textarea
              id="matrixJson"
              className="min-h-40 rounded-md border bg-background px-3 py-2 font-mono text-xs"
              value={matrixJson}
              onChange={(event) => setMatrixJson(event.target.value)}
              data-testid="matrix-json-input"
            />
          </div>
          <p className="text-sm text-muted-foreground" data-testid="matrix-generated-count">
            Generated assignments: {generatedAssignments.length}
          </p>
          <div className="rounded-md border p-3 text-xs">
            <p className="mb-2 text-muted-foreground">Активные сотрудники (helper)</p>
            <div className="flex flex-wrap gap-2">
              {employees.map((employee) => (
                <button
                  key={employee.employeeId}
                  type="button"
                  className="rounded border px-2 py-1 font-mono hover:bg-muted"
                  onClick={() => {
                    setParticipantsToAdd((previous) =>
                      previous.trim().length > 0
                        ? `${previous},${employee.employeeId}`
                        : employee.employeeId,
                    );
                  }}
                >
                  {employee.employeeId}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Веса и прогресс</CardTitle>
          <CardDescription>
            После первого draft save матрица/веса блокируются (`campaign_locked`).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="weightManager">Manager</Label>
              <Input
                id="weightManager"
                value={weights.manager}
                onChange={(event) =>
                  setWeights((previous) => ({ ...previous, manager: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="weightPeers">Peers</Label>
              <Input
                id="weightPeers"
                value={weights.peers}
                onChange={(event) =>
                  setWeights((previous) => ({ ...previous, peers: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="weightSubordinates">Subordinates</Label>
              <Input
                id="weightSubordinates"
                value={weights.subordinates}
                onChange={(event) =>
                  setWeights((previous) => ({ ...previous, subordinates: event.target.value }))
                }
              />
            </div>
          </div>
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={onUpdateWeights}
              disabled={!campaignId || !canMutate || isLocked}
              data-testid="weights-apply-button"
            >
              Apply weights
            </Button>
          </div>
          {progress ? (
            <div
              className="space-y-2 rounded-md border p-3 text-sm"
              data-testid="campaign-progress"
            >
              <p>
                Total questionnaires:{" "}
                <span className="font-medium">{progress.totalQuestionnaires}</span>
              </p>
              <p>
                Not started: {progress.statusCounts.notStarted}, in progress:{" "}
                {progress.statusCounts.inProgress}, submitted: {progress.statusCounts.submitted}
              </p>
              <p data-testid="campaign-pending-count">Pending total: {pendingCount}</p>
              <p className="text-muted-foreground">
                Lock at: {progress.campaignLockedAt ?? "not_locked"}
              </p>
              {progress.pendingQuestionnaires.length > 0 ? (
                <div className="rounded border p-2 text-xs">
                  <p className="mb-1 font-medium">Pending questionnaires:</p>
                  <ul className="space-y-1">
                    {progress.pendingQuestionnaires.map((item) => (
                      <li key={item.questionnaireId} className="font-mono">
                        {item.questionnaireId} · rater={item.raterEmployeeId} · subject=
                        {item.subjectEmployeeId} · {item.status}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {message ? <InlineBanner description={message} testId="hr-campaign-message" /> : null}

      {error ? (
        <InlineBanner
          title={friendlyError?.title}
          description={friendlyError?.description ?? "Попробуйте снова."}
          tone="error"
          testId="hr-campaign-error"
        />
      ) : null}
    </div>
  );
};
