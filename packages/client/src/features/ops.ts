/**
 * Ops client feature methods.
 * @docs .memory-bank/spec/client-api/operation-catalog.md
 * @see .memory-bank/spec/operations/runbook.md
 */
import {
  type OperationContext,
  type OperationResult,
  type OpsAiDiagnosticsListInput,
  type OpsAiDiagnosticsListOutput,
  type OpsAuditListInput,
  type OpsAuditListOutput,
  type OpsHealthGetInput,
  type OpsHealthGetOutput,
  errorFromUnknown,
  errorResult,
  parseOpsAiDiagnosticsListInput,
  parseOpsAiDiagnosticsListOutput,
  parseOpsAuditListInput,
  parseOpsAuditListOutput,
  parseOpsHealthGetInput,
  parseOpsHealthGetOutput,
} from "@feedback-360/api-contract";

import type { ClientRuntime } from "../shared/runtime";

export type OpsClientMethods = {
  opsHealthGet(
    input?: OpsHealthGetInput,
    context?: OperationContext,
  ): Promise<OperationResult<OpsHealthGetOutput>>;
  opsAiDiagnosticsList(
    input: OpsAiDiagnosticsListInput,
    context?: OperationContext,
  ): Promise<OperationResult<OpsAiDiagnosticsListOutput>>;
  opsAuditList(
    input: OpsAuditListInput,
    context?: OperationContext,
  ): Promise<OperationResult<OpsAuditListOutput>>;
};

export const createOpsClientMethods = (runtime: ClientRuntime): OpsClientMethods => ({
  opsHealthGet: async (input, context) => {
    let parsedInput: OpsHealthGetInput;
    try {
      parsedInput = parseOpsHealthGetInput(input ?? {});
    } catch (error) {
      return errorResult(errorFromUnknown(error, "invalid_input", "Invalid opsHealthGet input."));
    }

    return runtime.invokeOperation({
      operation: "ops.health.get",
      input: parsedInput,
      context,
      parseOutput: parseOpsHealthGetOutput,
    });
  },
  opsAiDiagnosticsList: async (input, context) => {
    let parsedInput: OpsAiDiagnosticsListInput;
    try {
      parsedInput = parseOpsAiDiagnosticsListInput(input);
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid opsAiDiagnosticsList input."),
      );
    }

    return runtime.invokeOperation({
      operation: "ops.aiDiagnostics.list",
      input: parsedInput,
      context,
      parseOutput: parseOpsAiDiagnosticsListOutput,
    });
  },
  opsAuditList: async (input, context) => {
    let parsedInput: OpsAuditListInput;
    try {
      parsedInput = parseOpsAuditListInput(input);
    } catch (error) {
      return errorResult(errorFromUnknown(error, "invalid_input", "Invalid opsAuditList input."));
    }

    return runtime.invokeOperation({
      operation: "ops.audit.list",
      input: parsedInput,
      context,
      parseOutput: parseOpsAuditListOutput,
    });
  },
});
