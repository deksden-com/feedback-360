import {
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
  type OperationContext,
  type OperationResult,
  errorFromUnknown,
  errorResult,
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

import type { ClientRuntime } from "../shared/runtime";

export type NotificationsClientMethods = {
  notificationsGenerateReminders(
    input: NotificationsGenerateRemindersInput,
    context?: OperationContext,
  ): Promise<OperationResult<NotificationsGenerateRemindersOutput>>;
  notificationsDispatchOutbox(
    input?: NotificationsDispatchOutboxInput,
    context?: OperationContext,
  ): Promise<OperationResult<NotificationsDispatchOutboxOutput>>;
  notificationReminderSettingsGet(
    context?: OperationContext,
  ): Promise<OperationResult<NotificationReminderSettingsOutput>>;
  notificationReminderSettingsUpsert(
    input: NotificationReminderSettingsUpsertInput,
    context?: OperationContext,
  ): Promise<OperationResult<NotificationReminderSettingsOutput>>;
  notificationReminderPreview(
    input?: NotificationReminderPreviewInput,
    context?: OperationContext,
  ): Promise<OperationResult<NotificationReminderPreviewOutput>>;
  notificationTemplateCatalog(
    context?: OperationContext,
  ): Promise<OperationResult<NotificationTemplateCatalogOutput>>;
  notificationTemplatePreview(
    input: NotificationTemplatePreviewInput,
    context?: OperationContext,
  ): Promise<OperationResult<NotificationTemplatePreviewOutput>>;
  notificationDeliveryDiagnostics(
    input?: NotificationDeliveryDiagnosticsInput,
    context?: OperationContext,
  ): Promise<OperationResult<NotificationDeliveryDiagnosticsOutput>>;
};

export const createNotificationsClientMethods = (
  runtime: ClientRuntime,
): NotificationsClientMethods => ({
  notificationsGenerateReminders: async (input, context) => {
    let parsedInput: NotificationsGenerateRemindersInput;
    try {
      parsedInput = parseNotificationsGenerateRemindersInput(input);
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid notificationsGenerateReminders input."),
      );
    }

    return runtime.invokeOperation({
      operation: "notifications.generateReminders",
      input: parsedInput,
      context,
      parseOutput: parseNotificationsGenerateRemindersOutput,
    });
  },

  notificationsDispatchOutbox: async (input, context) => {
    let parsedInput: NotificationsDispatchOutboxInput;
    try {
      parsedInput = parseNotificationsDispatchOutboxInput(input ?? {});
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid notificationsDispatchOutbox input."),
      );
    }

    return runtime.invokeOperation({
      operation: "notifications.dispatchOutbox",
      input: parsedInput,
      context,
      parseOutput: parseNotificationsDispatchOutboxOutput,
    });
  },

  notificationReminderSettingsGet: async (context) => {
    let parsedInput: Record<string, never>;
    try {
      parsedInput = parseNotificationReminderSettingsGetInput({});
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid notificationReminderSettingsGet input."),
      );
    }

    return runtime.invokeOperation({
      operation: "notifications.settings.get",
      input: parsedInput,
      context,
      parseOutput: parseNotificationReminderSettingsOutput,
    });
  },

  notificationReminderSettingsUpsert: async (input, context) => {
    let parsedInput: NotificationReminderSettingsUpsertInput;
    try {
      parsedInput = parseNotificationReminderSettingsUpsertInput(input);
    } catch (error) {
      return errorResult(
        errorFromUnknown(
          error,
          "invalid_input",
          "Invalid notificationReminderSettingsUpsert input.",
        ),
      );
    }

    return runtime.invokeOperation({
      operation: "notifications.settings.upsert",
      input: parsedInput,
      context,
      parseOutput: parseNotificationReminderSettingsOutput,
    });
  },

  notificationReminderPreview: async (input, context) => {
    let parsedInput: NotificationReminderPreviewInput;
    try {
      parsedInput = parseNotificationReminderPreviewInput(input ?? {});
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid notificationReminderPreview input."),
      );
    }

    return runtime.invokeOperation({
      operation: "notifications.settings.preview",
      input: parsedInput,
      context,
      parseOutput: parseNotificationReminderPreviewOutput,
    });
  },

  notificationTemplateCatalog: async (context) => {
    return runtime.invokeOperation({
      operation: "notifications.templates.list",
      input: {},
      context,
      parseOutput: parseNotificationTemplateCatalogOutput,
    });
  },

  notificationTemplatePreview: async (input, context) => {
    let parsedInput: NotificationTemplatePreviewInput;
    try {
      parsedInput = parseNotificationTemplatePreviewInput(input);
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid notificationTemplatePreview input."),
      );
    }

    return runtime.invokeOperation({
      operation: "notifications.templates.preview",
      input: parsedInput,
      context,
      parseOutput: parseNotificationTemplatePreviewOutput,
    });
  },

  notificationDeliveryDiagnostics: async (input, context) => {
    let parsedInput: NotificationDeliveryDiagnosticsInput;
    try {
      parsedInput = parseNotificationDeliveryDiagnosticsInput(input ?? {});
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid notificationDeliveryDiagnostics input."),
      );
    }

    return runtime.invokeOperation({
      operation: "notifications.deliveries.list",
      input: parsedInput,
      context,
      parseOutput: parseNotificationDeliveryDiagnosticsOutput,
    });
  },
});
