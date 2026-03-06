import {
  type DispatchOperationInput,
  type NotificationsDispatchOutboxInput,
  type NotificationsDispatchOutboxOutput,
  type NotificationsGenerateRemindersInput,
  type NotificationsGenerateRemindersOutput,
  type OperationResult,
  createOperationError,
  errorFromUnknown,
  errorResult,
  okResult,
  parseNotificationsDispatchOutboxInput,
  parseNotificationsDispatchOutboxOutput,
  parseNotificationsGenerateRemindersInput,
  parseNotificationsGenerateRemindersOutput,
} from "@feedback-360/api-contract";
import { dispatchNotificationOutbox, generateReminderOutbox } from "@feedback-360/db";

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
