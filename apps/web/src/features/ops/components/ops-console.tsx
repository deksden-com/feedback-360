"use client";

import type {
  CampaignListItem,
  MembershipRole,
  OperationError,
  OpsAiDiagnosticsListOutput,
  OpsAuditListOutput,
  OpsHealthGetOutput,
} from "@feedback-360/api-contract";
import { useMemo, useState } from "react";

import { InlineBanner } from "@/components/page-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFriendlyErrorCopy } from "@/lib/page-state";

import {
  aiStatusLabel,
  formatOpsDateTime,
  healthToneClasses,
  summarizeAiDiagnostics,
  summarizeAuditTrail,
} from "../lib/ops";

type ActionResponse<T> = { ok: true; data: T } | { ok: false; error: OperationError };

const sortCampaigns = (items: CampaignListItem[]) =>
  [...items].sort((a, b) => a.name.localeCompare(b.name));

export const OpsConsole = ({
  role,
  campaigns,
  initialHealth,
  initialAiDiagnostics,
  initialAudit,
}: {
  role: MembershipRole;
  campaigns: CampaignListItem[];
  initialHealth: OpsHealthGetOutput;
  initialAiDiagnostics: OpsAiDiagnosticsListOutput;
  initialAudit: OpsAuditListOutput;
}) => {
  const [health] = useState(initialHealth);
  const [aiDiagnostics, setAiDiagnostics] = useState(initialAiDiagnostics);
  const [auditTrail, setAuditTrail] = useState(initialAudit);
  const [campaignId, setCampaignId] = useState("");
  const [aiStatus, setAiStatus] = useState("");
  const [auditEventType, setAuditEventType] = useState("");
  const [auditActorUserId, setAuditActorUserId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<OperationError | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const canInspect = role === "hr_admin" || role === "hr_reader";
  const aiSummary = useMemo(
    () => summarizeAiDiagnostics(aiDiagnostics.items),
    [aiDiagnostics.items],
  );
  const auditSummary = useMemo(() => summarizeAuditTrail(auditTrail.items), [auditTrail.items]);
  const campaignOptions = useMemo(() => sortCampaigns(campaigns), [campaigns]);
  const friendlyError = error
    ? getFriendlyErrorCopy(error, {
        title: "Не удалось обновить ops console",
        description: "Проверьте фильтры и повторите действие.",
      })
    : null;

  const execute = async <T,>(action: string, input: unknown): Promise<ActionResponse<T>> => {
    const response = await fetch("/api/ops/execute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, input }),
    });
    return (await response.json()) as ActionResponse<T>;
  };

  const refreshAi = async () => {
    setError(null);
    setMessage(null);
    setIsBusy(true);
    const result = await execute<OpsAiDiagnosticsListOutput>("ops.aiDiagnostics.list", {
      ...(campaignId ? { campaignId } : {}),
      ...(aiStatus ? { status: aiStatus } : {}),
    });
    setIsBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setAiDiagnostics(result.data);
    setMessage("AI diagnostics обновлены.");
  };

  const refreshAudit = async () => {
    setError(null);
    setMessage(null);
    setIsBusy(true);
    const result = await execute<OpsAuditListOutput>("ops.audit.list", {
      ...(campaignId ? { campaignId } : {}),
      ...(auditEventType ? { eventType: auditEventType } : {}),
      ...(auditActorUserId ? { actorUserId: auditActorUserId } : {}),
      limit: 50,
    });
    setIsBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setAuditTrail(result.data);
    setMessage("Audit trail обновлён.");
  };

  if (!canInspect) {
    return null;
  }

  return (
    <div className="space-y-4" data-testid="ops-console-root">
      {message ? (
        <InlineBanner description={message} tone="success" testId="ops-console-flash" />
      ) : null}
      {friendlyError ? (
        <InlineBanner
          title={friendlyError.title}
          description={friendlyError.description}
          tone="error"
          testId="ops-console-error"
        />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card data-testid="ops-health-card">
          <CardHeader>
            <CardTitle>Health & release</CardTitle>
            <CardDescription>
              Текущий deploy, commit и базовые operational checks для окружения.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Environment</div>
                <div className="text-sm font-semibold" data-testid="ops-app-env">
                  {health.appEnv}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Version</div>
                <div className="text-sm font-semibold" data-testid="ops-app-version">
                  {health.appVersion}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Commit</div>
                <div className="text-sm font-semibold break-all" data-testid="ops-git-commit">
                  {health.gitCommitSha ?? "—"}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Branch</div>
                <div className="text-sm font-semibold" data-testid="ops-git-branch">
                  {health.gitBranch ?? "—"}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {health.checks.map((check) => (
                <div
                  key={check.key}
                  className={`rounded-lg border p-3 ${healthToneClasses[check.status]}`}
                  data-testid={`ops-health-check-${check.key}`}
                >
                  <div className="text-sm font-semibold">{check.label}</div>
                  <div className="text-xs">{check.detail}</div>
                </div>
              ))}
            </div>

            {health.deploymentUrl ? (
              <div className="text-xs text-muted-foreground">
                Deployment URL: <span className="font-medium">{health.deploymentUrl}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card data-testid="ops-ai-card">
          <CardHeader>
            <CardTitle>AI diagnostics</CardTitle>
            <CardDescription>
              Jobs, webhook receipts и duplicate/no-op deliveries для campaign-level AI processing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              {aiSummary.map((item) => (
                <div key={item.label} className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="text-lg font-semibold">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
              <div className="space-y-2">
                <Label htmlFor="ops-campaign-filter">Campaign</Label>
                <select
                  id="ops-campaign-filter"
                  value={campaignId}
                  onChange={(event) => setCampaignId(event.target.value)}
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  data-testid="ops-campaign-filter"
                >
                  <option value="">Все кампании</option>
                  {campaignOptions.map((campaign) => (
                    <option key={campaign.campaignId} value={campaign.campaignId}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ops-ai-status-filter">AI status</Label>
                <select
                  id="ops-ai-status-filter"
                  value={aiStatus}
                  onChange={(event) => setAiStatus(event.target.value)}
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  data-testid="ops-ai-status-filter"
                >
                  <option value="">Все статусы</option>
                  <option value="completed">completed</option>
                  <option value="failed">failed</option>
                  <option value="queued">queued</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={refreshAi}
                  disabled={isBusy}
                  data-testid="ops-ai-refresh"
                >
                  Обновить AI diagnostics
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {aiDiagnostics.items.map((item) => (
                <div key={item.aiJobId} className="rounded-lg border p-3" data-testid="ops-ai-row">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">
                        {aiStatusLabel(item.status)} · {item.provider}
                      </div>
                      <div className="text-xs text-muted-foreground break-all">{item.aiJobId}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      requested {formatOpsDateTime(item.requestedAt)} · completed{" "}
                      {formatOpsDateTime(item.completedAt)}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Campaign: {item.campaignId}
                  </div>
                  {item.receipt ? (
                    <details
                      className="mt-2 rounded-md border bg-muted/30 p-3"
                      data-testid="ops-ai-receipt"
                    >
                      <summary className="cursor-pointer text-sm font-medium">
                        Webhook receipt · deliveries {item.receipt.deliveryCount}
                      </summary>
                      <div className="mt-2 space-y-1 text-xs">
                        <div>Received: {formatOpsDateTime(item.receipt.receivedAt)}</div>
                        <div>Last received: {formatOpsDateTime(item.receipt.lastReceivedAt)}</div>
                        <div>Payload: {item.receipt.payloadSummary}</div>
                      </div>
                    </details>
                  ) : (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Webhook receipt ещё не получен.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="ops-audit-card">
        <CardHeader>
          <CardTitle>Audit & release console</CardTitle>
          <CardDescription>
            История release, UI и webhook событий по компании с фильтрами по кампании и актору.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            {auditSummary.map((item) => (
              <div key={item.label} className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">{item.label}</div>
                <div className="text-lg font-semibold">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_220px_220px_auto]">
            <div className="space-y-2">
              <Label htmlFor="ops-audit-event-type">Event type</Label>
              <Input
                id="ops-audit-event-type"
                value={auditEventType}
                onChange={(event) => setAuditEventType(event.target.value)}
                placeholder="campaign.start"
                data-testid="ops-audit-event-type"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ops-audit-actor">Actor user id</Label>
              <Input
                id="ops-audit-actor"
                value={auditActorUserId}
                onChange={(event) => setAuditActorUserId(event.target.value)}
                placeholder="user id"
                data-testid="ops-audit-actor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ops-audit-campaign">Campaign</Label>
              <select
                id="ops-audit-campaign"
                value={campaignId}
                onChange={(event) => setCampaignId(event.target.value)}
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                data-testid="ops-audit-campaign"
              >
                <option value="">Все кампании</option>
                {campaignOptions.map((campaign) => (
                  <option key={campaign.campaignId} value={campaign.campaignId}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                onClick={refreshAudit}
                disabled={isBusy}
                data-testid="ops-audit-refresh"
              >
                Обновить audit trail
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {auditTrail.items.map((item) => (
              <div
                key={item.auditEventId}
                className="rounded-lg border p-3"
                data-testid="ops-audit-row"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">{item.summary}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.source} · {item.eventType} · {item.objectType}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatOpsDateTime(item.createdAt)}
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Campaign: {item.campaignId ?? "—"} · Actor:{" "}
                  {item.actorUserId ?? "redacted/system"} · Role: {item.actorRole ?? "—"}
                </div>
                <details
                  className="mt-2 rounded-md border bg-muted/30 p-3"
                  data-testid="ops-audit-metadata"
                >
                  <summary className="cursor-pointer text-sm font-medium">Metadata</summary>
                  <pre className="mt-2 overflow-x-auto text-xs">
                    {JSON.stringify(item.metadataJson, null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
