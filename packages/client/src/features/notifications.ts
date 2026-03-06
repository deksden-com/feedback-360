import {
  type NotificationsDispatchOutboxInput,
  type NotificationsDispatchOutboxOutput,
  type NotificationsGenerateRemindersInput,
  type NotificationsGenerateRemindersOutput,
  type OperationContext,
  type OperationResult,
  errorFromUnknown,
  errorResult,
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
});
