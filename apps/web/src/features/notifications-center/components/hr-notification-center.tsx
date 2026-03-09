"use client";

import type {
  CampaignListItem,
  MembershipRole,
  NotificationDeliveryDiagnosticsOutput,
  NotificationReminderPreviewOutput,
  NotificationReminderSettingsOutput,
  NotificationTemplateCatalogItem,
  NotificationTemplatePreviewOutput,
  OperationError,
} from "@feedback-360/api-contract";
import { useMemo, useState } from "react";

import { InlineBanner } from "@/components/page-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFriendlyErrorCopy } from "@/lib/page-state";

import {
  deliveryStatusLabels,
  describeReminderPreview,
  formatNotificationDateTime,
  formatWeekdaySummary,
  summarizeDeliveryStats,
  weekdayOptions,
} from "../lib/notifications-center";

/**
 * HR notification center for reminders, template previews, and delivery diagnostics.
 * @docs .memory-bank/spec/ui/screens/hr-notifications.md
 * @see .memory-bank/spec/notifications/notifications.md
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

type ReminderFormState = {
  reminderScheduledHour: number;
  quietHoursStart: number;
  quietHoursEnd: number;
  reminderWeekdays: number[];
};

const statusToneMap: Record<string, "default" | "success" | "warning" | "error"> = {
  pending: "default",
  sent: "success",
  retry_scheduled: "warning",
  failed: "error",
  dead_letter: "error",
};

const parseNumericField = (value: string): number => Number.parseInt(value, 10);

const sortCampaignsForOps = (items: CampaignListItem[]): CampaignListItem[] => {
  return [...items].sort((left, right) => left.name.localeCompare(right.name));
};

export const HrNotificationCenter = ({
  role,
  campaigns,
  initialSettings,
  initialPreview,
  initialTemplates,
  initialTemplatePreview,
  initialDeliveries,
}: {
  role: MembershipRole;
  campaigns: CampaignListItem[];
  initialSettings: NotificationReminderSettingsOutput;
  initialPreview: NotificationReminderPreviewOutput;
  initialTemplates: NotificationTemplateCatalogItem[];
  initialTemplatePreview: NotificationTemplatePreviewOutput | null;
  initialDeliveries: NotificationDeliveryDiagnosticsOutput;
}) => {
  const canMutate = role === "hr_admin";
  const [settings, setSettings] = useState<ReminderFormState>({
    reminderScheduledHour: initialSettings.reminderScheduledHour,
    quietHoursStart: initialSettings.quietHoursStart,
    quietHoursEnd: initialSettings.quietHoursEnd,
    reminderWeekdays: initialSettings.reminderWeekdays,
  });
  const [preview, setPreview] = useState(initialPreview);
  const [selectedCampaignId, setSelectedCampaignId] = useState(initialPreview.campaignId ?? "");
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<
    NotificationTemplateCatalogItem["templateKey"]
  >(
    initialTemplatePreview?.templateKey ?? initialTemplates[0]?.templateKey ?? "campaign_invite@v1",
  );
  const [selectedTemplateCampaignId, setSelectedTemplateCampaignId] = useState(
    initialPreview.campaignId ?? "",
  );
  const [templatePreview, setTemplatePreview] = useState(initialTemplatePreview);
  const [deliveries, setDeliveries] = useState(initialDeliveries);
  const [deliveryCampaignId, setDeliveryCampaignId] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<OperationError | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const deliveryStats = useMemo(() => summarizeDeliveryStats(deliveries.items), [deliveries.items]);
  const friendlyError = error
    ? getFriendlyErrorCopy(error, {
        title: "Не удалось обновить notification center",
        description: "Проверьте параметры формы и повторите действие.",
      })
    : null;
  const campaignOptions = useMemo(() => sortCampaignsForOps(campaigns), [campaigns]);

  const execute = async <T,>(action: string, input: unknown): Promise<ActionResponse<T>> => {
    const response = await fetch("/api/hr/notifications/execute", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ action, input }),
    });

    return (await response.json()) as ActionResponse<T>;
  };

  const clearFeedback = () => {
    setMessage(null);
    setError(null);
  };

  const validateSettings = (): OperationError | null => {
    if (settings.reminderWeekdays.length === 0) {
      return {
        code: "invalid_input",
        message: "Выберите хотя бы один день недели.",
      };
    }

    const values = [
      settings.reminderScheduledHour,
      settings.quietHoursStart,
      settings.quietHoursEnd,
    ];
    if (values.some((value) => !Number.isInteger(value) || value < 0 || value > 23)) {
      return {
        code: "invalid_input",
        message: "Часы должны быть целыми числами от 0 до 23.",
      };
    }

    if (settings.quietHoursEnd <= settings.quietHoursStart) {
      return {
        code: "invalid_input",
        message: "quietHoursEnd должен быть больше quietHoursStart.",
      };
    }

    return null;
  };

  const runPreview = async () => {
    clearFeedback();
    const validationError = validateSettings();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsBusy(true);
    const result = await execute<NotificationReminderPreviewOutput>(
      "notifications.settings.preview",
      {
        ...(selectedCampaignId ? { campaignId: selectedCampaignId } : {}),
        reminderScheduledHour: settings.reminderScheduledHour,
        quietHoursStart: settings.quietHoursStart,
        quietHoursEnd: settings.quietHoursEnd,
        reminderWeekdays: settings.reminderWeekdays,
      },
    );
    setIsBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setPreview(result.data);
    setMessage("Preview обновлён.");
  };

  const saveSettings = async () => {
    if (!canMutate) {
      return;
    }

    clearFeedback();
    const validationError = validateSettings();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsBusy(true);
    const result = await execute<NotificationReminderSettingsOutput>(
      "notifications.settings.upsert",
      {
        reminderScheduledHour: settings.reminderScheduledHour,
        quietHoursStart: settings.quietHoursStart,
        quietHoursEnd: settings.quietHoursEnd,
        reminderWeekdays: settings.reminderWeekdays,
      },
    );
    setIsBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage("Reminder settings сохранены.");
    await runPreview();
  };

  const loadTemplatePreview = async () => {
    clearFeedback();
    setIsBusy(true);
    const result = await execute<NotificationTemplatePreviewOutput>(
      "notifications.templates.preview",
      {
        templateKey: selectedTemplateKey,
        ...(selectedTemplateCampaignId ? { campaignId: selectedTemplateCampaignId } : {}),
      },
    );
    setIsBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setTemplatePreview(result.data);
    setMessage("Preview шаблона обновлён.");
  };

  const loadDeliveries = async () => {
    clearFeedback();
    setIsBusy(true);
    const result = await execute<NotificationDeliveryDiagnosticsOutput>(
      "notifications.deliveries.list",
      {
        ...(deliveryCampaignId ? { campaignId: deliveryCampaignId } : {}),
        ...(deliveryStatus ? { status: deliveryStatus } : {}),
        channel: "email",
      },
    );
    setIsBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setDeliveries(result.data);
    setMessage("Delivery diagnostics обновлены.");
  };

  return (
    <div className="space-y-4" data-testid="notification-center-root">
      {message ? (
        <InlineBanner description={message} tone="success" testId="notification-center-flash" />
      ) : null}
      {friendlyError ? (
        <InlineBanner
          title={friendlyError.title}
          description={friendlyError.description}
          tone="error"
          testId="notification-center-error"
        />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card data-testid="reminder-settings-card">
          <CardHeader>
            <CardTitle>Reminder schedule</CardTitle>
            <CardDescription>
              HR настраивает cadence, quiet hours и сразу видит следующий запуск в effective
              timezone кампании.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reminder-campaign">Campaign (optional)</Label>
                <select
                  id="reminder-campaign"
                  value={selectedCampaignId}
                  onChange={(event) => setSelectedCampaignId(event.target.value)}
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  data-testid="reminder-campaign-select"
                >
                  <option value="">Company default</option>
                  {campaignOptions.map((campaign) => (
                    <option key={campaign.campaignId} value={campaign.campaignId}>
                      {campaign.name} · {campaign.status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled-hour">Reminder hour</Label>
                <Input
                  id="scheduled-hour"
                  type="number"
                  min={0}
                  max={23}
                  value={String(settings.reminderScheduledHour)}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      reminderScheduledHour: parseNumericField(event.target.value),
                    }))
                  }
                  data-testid="reminder-hour-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet-start">Quiet start</Label>
                <Input
                  id="quiet-start"
                  type="number"
                  min={0}
                  max={23}
                  value={String(settings.quietHoursStart)}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      quietHoursStart: parseNumericField(event.target.value),
                    }))
                  }
                  data-testid="quiet-start-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet-end">Quiet end</Label>
                <Input
                  id="quiet-end"
                  type="number"
                  min={0}
                  max={23}
                  value={String(settings.quietHoursEnd)}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      quietHoursEnd: parseNumericField(event.target.value),
                    }))
                  }
                  data-testid="quiet-end-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Weekdays</Label>
              <div className="grid gap-2 sm:grid-cols-4 xl:grid-cols-7">
                {weekdayOptions.map((option) => {
                  const checked = settings.reminderWeekdays.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        data-testid={`weekday-toggle-${option.value}`}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            reminderWeekdays: event.target.checked
                              ? [...current.reminderWeekdays, option.value].sort((a, b) => a - b)
                              : current.reminderWeekdays.filter((value) => value !== option.value),
                          }))
                        }
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground" data-testid="reminder-weekdays-summary">
                {formatWeekdaySummary(settings.reminderWeekdays)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void runPreview()}
                disabled={isBusy}
                data-testid="reminder-preview-button"
              >
                {isBusy ? "Обновляем…" : "Обновить preview"}
              </Button>
              <Button
                type="button"
                onClick={() => void saveSettings()}
                disabled={!canMutate || isBusy}
                data-testid="reminder-save-button"
              >
                Сохранить schedule
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="reminder-preview-card">
          <CardHeader>
            <CardTitle>Effective preview</CardTitle>
            <CardDescription>
              Наследование timezone идёт от company, campaign может override effective timezone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p data-testid="reminder-preview-summary">{describeReminderPreview(preview)}</p>
            <div className="grid gap-3 rounded-md border bg-muted/30 p-4">
              <p>
                <span className="font-medium">Company timezone:</span> {preview.companyTimezone}
              </p>
              <p>
                <span className="font-medium">Campaign timezone:</span>{" "}
                {preview.campaignTimezone ?? "—"}
              </p>
              <p>
                <span className="font-medium">Quiet hours:</span> {preview.quietHoursStart}:00–
                {preview.quietHoursEnd}:00
              </p>
              <p>
                <span className="font-medium">Weekdays:</span>{" "}
                {formatWeekdaySummary(preview.reminderWeekdays)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card data-testid="template-catalog-card">
          <CardHeader>
            <CardTitle>Template catalog</CardTitle>
            <CardDescription>
              RU v1 templates и переменные, которые HR видит до старта кампании.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="template-key">Template</Label>
              <select
                id="template-key"
                value={selectedTemplateKey}
                onChange={(event) =>
                  setSelectedTemplateKey(
                    event.target.value as NotificationTemplateCatalogItem["templateKey"],
                  )
                }
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                data-testid="template-select"
              >
                {initialTemplates.map((template) => (
                  <option key={template.templateKey} value={template.templateKey}>
                    {template.title} · {template.templateKey}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-campaign">Campaign context</Label>
              <select
                id="template-campaign"
                value={selectedTemplateCampaignId}
                onChange={(event) => setSelectedTemplateCampaignId(event.target.value)}
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                data-testid="template-campaign-select"
              >
                <option value="">Sample payload</option>
                {campaignOptions.map((campaign) => (
                  <option key={campaign.campaignId} value={campaign.campaignId}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadTemplatePreview()}
              disabled={isBusy}
              data-testid="template-preview-button"
            >
              Обновить preview
            </Button>

            <div className="grid gap-3">
              {initialTemplates.map((template) => (
                <div
                  key={template.templateKey}
                  className="rounded-md border p-3 text-sm"
                  data-testid={`template-row-${template.templateKey}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{template.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {template.locale}/{template.version}/{template.channel}
                    </p>
                  </div>
                  <p className="mt-1 text-muted-foreground">{template.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Variables: {template.variables.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="template-preview-card">
          <CardHeader>
            <CardTitle>Template preview</CardTitle>
            <CardDescription>
              Preview строится из canonical metadata и sample/campaign context.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {templatePreview ? (
              <>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border px-2 py-1">
                    {templatePreview.templateKey}
                  </span>
                  <span className="rounded-full border px-2 py-1">
                    {templatePreview.locale}/{templatePreview.version}/{templatePreview.channel}
                  </span>
                </div>
                <div className="rounded-md border bg-muted/20 p-4 text-sm">
                  <p className="font-medium" data-testid="template-preview-subject">
                    {templatePreview.subject}
                  </p>
                  <p
                    className="mt-2 whitespace-pre-wrap text-muted-foreground"
                    data-testid="template-preview-text"
                  >
                    {templatePreview.text}
                  </p>
                </div>
                <div className="rounded-md border p-4 text-sm">
                  <p className="font-medium">Variables</p>
                  <div className="mt-2 flex flex-wrap gap-2" data-testid="template-preview-vars">
                    {templatePreview.variables.map((variable) => (
                      <span key={variable} className="rounded-full border px-2 py-1 text-xs">
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <InlineBanner
                description="Выберите шаблон, чтобы открыть preview."
                tone="warning"
                testId="template-preview-empty"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card data-testid="delivery-diagnostics-card">
        <CardHeader>
          <CardTitle>Delivery diagnostics</CardTitle>
          <CardDescription>
            Outbox и история попыток отправки. Статус `retry_scheduled` означает pending row с
            future `next_retry_at`.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            {deliveryStats.map((item) => (
              <div
                key={item.label}
                className="rounded-md border p-3"
                data-testid={`delivery-stat-${item.label}`}
              >
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-2xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <div className="space-y-2">
              <Label htmlFor="delivery-campaign">Campaign filter</Label>
              <select
                id="delivery-campaign"
                value={deliveryCampaignId}
                onChange={(event) => setDeliveryCampaignId(event.target.value)}
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                data-testid="delivery-campaign-select"
              >
                <option value="">All campaigns</option>
                {campaignOptions.map((campaign) => (
                  <option key={campaign.campaignId} value={campaign.campaignId}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery-status">Status filter</Label>
              <select
                id="delivery-status"
                value={deliveryStatus}
                onChange={(event) => setDeliveryStatus(event.target.value)}
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                data-testid="delivery-status-select"
              >
                <option value="">All statuses</option>
                <option value="pending">pending</option>
                <option value="sent">sent</option>
                <option value="retry_scheduled">retry_scheduled</option>
                <option value="failed">failed</option>
                <option value="dead_letter">dead_letter</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => void loadDeliveries()}
                disabled={isBusy}
                data-testid="delivery-refresh-button"
              >
                Обновить таблицу
              </Button>
            </div>
          </div>

          {deliveries.items.length === 0 ? (
            <InlineBanner
              description="По текущим фильтрам нет доставок. Сгенерируйте outbox или сбросьте фильтры."
              tone="warning"
              testId="delivery-empty"
            />
          ) : (
            <div className="grid gap-3">
              {deliveries.items.map((item) => (
                <details
                  key={item.outboxId}
                  className="rounded-md border"
                  data-testid={`delivery-row-${item.outboxId}`}
                >
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {item.campaignName} → {item.recipientLabel}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.templateKey} · {item.toEmail}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span
                        className="rounded-full border px-3 py-1"
                        data-testid={`delivery-status-${item.outboxId}`}
                      >
                        {deliveryStatusLabels[item.status] ?? item.status}
                      </span>
                      <span className="text-muted-foreground">attempts {item.attempts}</span>
                    </div>
                  </summary>
                  <div className="grid gap-3 border-t px-4 py-4 text-sm">
                    <div className="grid gap-2 md:grid-cols-2">
                      <p>
                        <span className="font-medium">Next retry:</span>{" "}
                        {formatNotificationDateTime(item.nextRetryAt)}
                      </p>
                      <p>
                        <span className="font-medium">Last error:</span> {item.lastError ?? "—"}
                      </p>
                      <p>
                        <span className="font-medium">Event:</span> {item.eventType}
                      </p>
                      <p>
                        <span className="font-medium">Idempotency:</span> {item.idempotencyKey}
                      </p>
                    </div>
                    <div className="rounded-md border bg-muted/20 p-3">
                      <p className="font-medium">Attempt history</p>
                      <div
                        className="mt-2 grid gap-2"
                        data-testid={`delivery-attempts-${item.outboxId}`}
                      >
                        {item.attemptsHistory.length === 0 ? (
                          <p className="text-muted-foreground">Попыток пока нет.</p>
                        ) : (
                          item.attemptsHistory.map((attempt) => (
                            <div
                              key={`${item.outboxId}-${attempt.attemptNo}`}
                              className="rounded-md border bg-background p-3"
                            >
                              <p className="font-medium">
                                Attempt #{attempt.attemptNo} · {attempt.status}
                              </p>
                              <p className="text-muted-foreground">
                                {attempt.provider} ·{" "}
                                {formatNotificationDateTime(attempt.requestedAt)}
                              </p>
                              <p className="text-muted-foreground">{attempt.errorMessage ?? "—"}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
