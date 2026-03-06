import {
  type EmployeeListActiveInput,
  type EmployeeListActiveOutput,
  type EmployeeUpsertInput,
  type EmployeeUpsertOutput,
  type OperationContext,
  type OperationResult,
  type OrgDepartmentMoveInput,
  type OrgDepartmentMoveOutput,
  type OrgManagerSetInput,
  type OrgManagerSetOutput,
  errorFromUnknown,
  errorResult,
  parseEmployeeListActiveInput,
  parseEmployeeListActiveOutput,
  parseEmployeeUpsertInput,
  parseEmployeeUpsertOutput,
  parseOrgDepartmentMoveInput,
  parseOrgDepartmentMoveOutput,
  parseOrgManagerSetInput,
  parseOrgManagerSetOutput,
} from "@feedback-360/api-contract";

import type { ClientRuntime } from "../shared/runtime";

export type OrgClientMethods = {
  employeeUpsert(
    input: EmployeeUpsertInput,
    context?: OperationContext,
  ): Promise<OperationResult<EmployeeUpsertOutput>>;
  employeeListActive(
    input?: EmployeeListActiveInput,
    context?: OperationContext,
  ): Promise<OperationResult<EmployeeListActiveOutput>>;
  orgDepartmentMove(
    input: OrgDepartmentMoveInput,
    context?: OperationContext,
  ): Promise<OperationResult<OrgDepartmentMoveOutput>>;
  orgManagerSet(
    input: OrgManagerSetInput,
    context?: OperationContext,
  ): Promise<OperationResult<OrgManagerSetOutput>>;
};

export const createOrgClientMethods = (runtime: ClientRuntime): OrgClientMethods => ({
  employeeUpsert: async (input, context) => {
    let parsedInput: EmployeeUpsertInput;
    try {
      parsedInput = parseEmployeeUpsertInput(input);
    } catch (error) {
      return errorResult(errorFromUnknown(error, "invalid_input", "Invalid employeeUpsert input."));
    }

    return runtime.invokeOperation({
      operation: "employee.upsert",
      input: parsedInput,
      context,
      parseOutput: parseEmployeeUpsertOutput,
    });
  },

  employeeListActive: async (input, context) => {
    let parsedInput: EmployeeListActiveInput;
    try {
      parsedInput = parseEmployeeListActiveInput(input ?? {});
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid employeeListActive input."),
      );
    }

    return runtime.invokeOperation({
      operation: "employee.listActive",
      input: parsedInput,
      context,
      parseOutput: parseEmployeeListActiveOutput,
    });
  },

  orgDepartmentMove: async (input, context) => {
    let parsedInput: OrgDepartmentMoveInput;
    try {
      parsedInput = parseOrgDepartmentMoveInput(input);
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid orgDepartmentMove input."),
      );
    }

    return runtime.invokeOperation({
      operation: "org.department.move",
      input: parsedInput,
      context,
      parseOutput: parseOrgDepartmentMoveOutput,
    });
  },

  orgManagerSet: async (input, context) => {
    let parsedInput: OrgManagerSetInput;
    try {
      parsedInput = parseOrgManagerSetInput(input);
    } catch (error) {
      return errorResult(errorFromUnknown(error, "invalid_input", "Invalid orgManagerSet input."));
    }

    return runtime.invokeOperation({
      operation: "org.manager.set",
      input: parsedInput,
      context,
      parseOutput: parseOrgManagerSetOutput,
    });
  },
});
