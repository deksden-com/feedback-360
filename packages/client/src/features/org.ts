import {
  type DepartmentListInput,
  type DepartmentListOutput,
  type DepartmentUpsertInput,
  type DepartmentUpsertOutput,
  type EmployeeDirectoryListInput,
  type EmployeeDirectoryListOutput,
  type EmployeeListActiveInput,
  type EmployeeListActiveOutput,
  type EmployeeProfileGetInput,
  type EmployeeProfileGetOutput,
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
  parseDepartmentListInput,
  parseDepartmentListOutput,
  parseDepartmentUpsertInput,
  parseDepartmentUpsertOutput,
  parseEmployeeDirectoryListInput,
  parseEmployeeDirectoryListOutput,
  parseEmployeeListActiveInput,
  parseEmployeeListActiveOutput,
  parseEmployeeProfileGetInput,
  parseEmployeeProfileGetOutput,
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
  employeeDirectoryList(
    input?: EmployeeDirectoryListInput,
    context?: OperationContext,
  ): Promise<OperationResult<EmployeeDirectoryListOutput>>;
  employeeProfileGet(
    input: EmployeeProfileGetInput,
    context?: OperationContext,
  ): Promise<OperationResult<EmployeeProfileGetOutput>>;
  departmentList(
    input?: DepartmentListInput,
    context?: OperationContext,
  ): Promise<OperationResult<DepartmentListOutput>>;
  departmentUpsert(
    input: DepartmentUpsertInput,
    context?: OperationContext,
  ): Promise<OperationResult<DepartmentUpsertOutput>>;
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

  employeeDirectoryList: async (input, context) => {
    let parsedInput: EmployeeDirectoryListInput;
    try {
      parsedInput = parseEmployeeDirectoryListInput(input ?? {});
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid employeeDirectoryList input."),
      );
    }

    return runtime.invokeOperation({
      operation: "employee.directoryList",
      input: parsedInput,
      context,
      parseOutput: parseEmployeeDirectoryListOutput,
    });
  },

  employeeProfileGet: async (input, context) => {
    let parsedInput: EmployeeProfileGetInput;
    try {
      parsedInput = parseEmployeeProfileGetInput(input);
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid employeeProfileGet input."),
      );
    }

    return runtime.invokeOperation({
      operation: "employee.profileGet",
      input: parsedInput,
      context,
      parseOutput: parseEmployeeProfileGetOutput,
    });
  },

  departmentList: async (input, context) => {
    let parsedInput: DepartmentListInput;
    try {
      parsedInput = parseDepartmentListInput(input ?? {});
    } catch (error) {
      return errorResult(errorFromUnknown(error, "invalid_input", "Invalid departmentList input."));
    }

    return runtime.invokeOperation({
      operation: "department.list",
      input: parsedInput,
      context,
      parseOutput: parseDepartmentListOutput,
    });
  },

  departmentUpsert: async (input, context) => {
    let parsedInput: DepartmentUpsertInput;
    try {
      parsedInput = parseDepartmentUpsertInput(input);
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid departmentUpsert input."),
      );
    }

    return runtime.invokeOperation({
      operation: "department.upsert",
      input: parsedInput,
      context,
      parseOutput: parseDepartmentUpsertOutput,
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
