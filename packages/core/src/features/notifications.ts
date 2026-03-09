/**
 * Notifications feature-area entrypoint.
 * @docs .memory-bank/spec/notifications/notifications.md
 * @see .memory-bank/spec/notifications/outbox-and-retries.md
 */
import {
  type DispatchOperationInput,
  type NotificationDeliveryDiagnosticsInput,
  type NotificationDeliveryDiagnosticsOutput,
  type NotificationReminderPreviewInput,
  type NotificationReminderPreviewOutput,
  type NotificationReminderSettingsOutput,
  type NotificationReminderSettingsUpsertInput,
  type NotificationTemplateCatalogOutput,
  type NotificationTemplatePreviewInput,
  type NotificationTemplatePreviewOutput,
  type NotificationsDispatchOutboxInput,
  type NotificationsDispatchOutboxOutput,
  type NotificationsGenerateRemindersInput,
  type NotificationsGenerateRemindersOutput,
  type OperationResult,
  createOperationError,
  errorFromUnknown,
  errorResult,
  okResult,
  parseNotificationDeliveryDiagnosticsInput,
  parseNotificationDeliveryDiagnosticsOutput,
  parseNotificationReminderPreviewInput,
  parseNotificationReminderPreviewOutput,
  parseNotificationReminderSettingsGetInput,
  parseNotificationReminderSettingsOutput,
  parseNotificationReminderSettingsUpsertInput,
  parseNotificationTemplateCatalogOutput,
  parseNotificationTemplatePreviewInput,
  parseNotificationTemplatePreviewOutput,
  parseNotificationsDispatchOutboxInput,
  parseNotificationsDispatchOutboxOutput,
  parseNotificationsGenerateRemindersInput,
  parseNotificationsGenerateRemindersOutput,
} from "@feedback-360/api-contract";
import {
  dispatchNotificationOutbox,
  generateReminderOutbox,
  getNotificationReminderSettings,
  listNotificationDeliveryDiagnostics,
  listNotificationTemplateCatalog,
  previewNotificationReminderSchedule,
  previewNotificationTemplate,
  upsertNotificationReminderSettings,
} from "@feedback-360/db";

import { recordAuditEvent } from "../shared/audit";
import { ensureContextCompany, hasRole } from "../shared/context";

export const runNotificationsGenerateReminders = async (
  request: DispatchOperationInput,
): Promise<OperationResult<NotificationsGenerateRemindersOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can generate reminders.", {
        operation: "notifications.generateReminders",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: NotificationsGenerateRemindersInput;
  try {
    parsedInput = parseNotificationsGenerateRemindersInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid notifications.generateReminders input."),
    );
  }

  try {
    const output = await generateReminderOutbox({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
      ...(parsedInput.now ? { now: new Date(parsedInput.now) } : {}),
    });
    return okResult(parseNotificationsGenerateRemindersOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to generate reminder outbox."),
    );
  }
};

export const runNotificationsDispatchOutbox = async (
  request: DispatchOperationInput,
): Promise<OperationResult<NotificationsDispatchOutboxOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can dispatch notifications.", {
        operation: "notifications.dispatchOutbox",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: NotificationsDispatchOutboxInput;
  try {
    parsedInput = parseNotificationsDispatchOutboxInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid notifications.dispatchOutbox input."),
    );
  }

  try {
    const output = await dispatchNotificationOutbox({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
      limit: parsedInput.limit,
      provider: parsedInput.provider,
    });
    return okResult(parseNotificationsDispatchOutboxOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to dispatch notification outbox."),
    );
  }
};

export const runNotificationReminderSettingsGet = async (
  request: DispatchOperationInput,
): Promise<OperationResult<NotificationReminderSettingsOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR roles can view notification settings.", {
        operation: "notifications.settings.get",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  try {
    parseNotificationReminderSettingsGetInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid notifications.settings.get input."),
    );
  }

  try {
    const output = await getNotificationReminderSettings(companyIdOrError);
    return okResult(
      parseNotificationReminderSettingsOutput({
        ...output,
        updatedAt: output.updatedAt.toISOString(),
      }),
    );
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to load notification settings."),
    );
  }
};

export const runNotificationReminderSettingsUpsert = async (
  request: DispatchOperationInput,
): Promise<OperationResult<NotificationReminderSettingsOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can update notification settings.", {
        operation: "notifications.settings.upsert",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: NotificationReminderSettingsUpsertInput;
  try {
    parsedInput = parseNotificationReminderSettingsUpsertInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid notifications.settings.upsert input."),
    );
  }

  try {
    const output = await upsertNotificationReminderSettings({
      companyId: companyIdOrError,
      ...parsedInput,
    });
    await recordAuditEvent(request, {
      companyId: companyIdOrError,
      eventType: "notifications.settings_updated",
      objectType: "notification_settings",
      objectId: companyIdOrError,
      summary: "Обновлены reminder settings компании.",
      metadataJson: {
        reminderScheduledHour: output.reminderScheduledHour,
        quietHoursStart: output.quietHoursStart,
        quietHoursEnd: output.quietHoursEnd,
        reminderWeekdays: output.reminderWeekdays,
      },
    });
    return okResult(
      parseNotificationReminderSettingsOutput({
        ...output,
        updatedAt: output.updatedAt.toISOString(),
      }),
    );
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to update notification settings."),
    );
  }
};

export const runNotificationReminderPreview = async (
  request: DispatchOperationInput,
): Promise<OperationResult<NotificationReminderPreviewOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR roles can preview reminder schedule.", {
        operation: "notifications.settings.preview",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: NotificationReminderPreviewInput;
  try {
    parsedInput = parseNotificationReminderPreviewInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid notifications.settings.preview input."),
    );
  }

  try {
    const output = await previewNotificationReminderSchedule({
      companyId: companyIdOrError,
      ...(parsedInput.campaignId ? { campaignId: parsedInput.campaignId } : {}),
      ...(parsedInput.now ? { now: new Date(parsedInput.now) } : {}),
      draftSettings: {
        ...(parsedInput.reminderScheduledHour !== undefined
          ? { reminderScheduledHour: parsedInput.reminderScheduledHour }
          : {}),
        ...(parsedInput.quietHoursStart !== undefined
          ? { quietHoursStart: parsedInput.quietHoursStart }
          : {}),
        ...(parsedInput.quietHoursEnd !== undefined
          ? { quietHoursEnd: parsedInput.quietHoursEnd }
          : {}),
        ...(parsedInput.reminderWeekdays !== undefined
          ? { reminderWeekdays: parsedInput.reminderWeekdays }
          : {}),
      },
    });
    return okResult(
      parseNotificationReminderPreviewOutput({
        ...output,
        nextRunAt: output.nextRunAt?.toISOString() ?? null,
      }),
    );
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to preview reminder schedule."),
    );
  }
};

export const runNotificationTemplateCatalog = async (
  request: DispatchOperationInput,
): Promise<OperationResult<NotificationTemplateCatalogOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR roles can view notification templates.", {
        operation: "notifications.templates.list",
      }),
    );
  }

  try {
    const output = await listNotificationTemplateCatalog();
    return okResult(parseNotificationTemplateCatalogOutput({ items: output }));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to load notification templates."),
    );
  }
};

export const runNotificationTemplatePreview = async (
  request: DispatchOperationInput,
): Promise<OperationResult<NotificationTemplatePreviewOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR roles can preview notification templates.", {
        operation: "notifications.templates.preview",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: NotificationTemplatePreviewInput;
  try {
    parsedInput = parseNotificationTemplatePreviewInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid notifications.templates.preview input."),
    );
  }

  try {
    const output = await previewNotificationTemplate({
      companyId: companyIdOrError,
      templateKey: parsedInput.templateKey,
      ...(parsedInput.campaignId ? { campaignId: parsedInput.campaignId } : {}),
    });
    return okResult(parseNotificationTemplatePreviewOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to preview notification template."),
    );
  }
};

export const runNotificationDeliveryDiagnostics = async (
  request: DispatchOperationInput,
): Promise<OperationResult<NotificationDeliveryDiagnosticsOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR roles can view delivery diagnostics.", {
        operation: "notifications.deliveries.list",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: NotificationDeliveryDiagnosticsInput;
  try {
    parsedInput = parseNotificationDeliveryDiagnosticsInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid notifications.deliveries.list input."),
    );
  }

  try {
    const output = await listNotificationDeliveryDiagnostics({
      companyId: companyIdOrError,
      ...parsedInput,
    });
    return okResult(
      parseNotificationDeliveryDiagnosticsOutput({
        items: output.items.map((item) => ({
          ...item,
          nextRetryAt: item.nextRetryAt?.toISOString() ?? null,
          attemptsHistory: item.attemptsHistory.map((attempt) => ({
            ...attempt,
            requestedAt: attempt.requestedAt.toISOString(),
          })),
        })),
      }),
    );
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to load delivery diagnostics."),
    );
  }
};
