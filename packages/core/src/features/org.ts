import {
  type DispatchOperationInput,
  type EmployeeListActiveInput,
  type EmployeeListActiveOutput,
  type EmployeeUpsertInput,
  type EmployeeUpsertOutput,
  type OperationResult,
  type OrgDepartmentMoveInput,
  type OrgDepartmentMoveOutput,
  type OrgManagerSetInput,
  type OrgManagerSetOutput,
  createOperationError,
  errorFromUnknown,
  errorResult,
  okResult,
  parseEmployeeListActiveInput,
  parseEmployeeListActiveOutput,
  parseEmployeeUpsertInput,
  parseEmployeeUpsertOutput,
  parseOrgDepartmentMoveInput,
  parseOrgDepartmentMoveOutput,
  parseOrgManagerSetInput,
  parseOrgManagerSetOutput,
} from "@feedback-360/api-contract";
import {
  listActiveEmployees,
  moveEmployeeDepartment,
  setEmployeeManager,
  upsertEmployee,
} from "@feedback-360/db";

import { ensureContextCompany, hasRole } from "../shared/context";

export const runEmployeeUpsert = async (
  request: DispatchOperationInput,
): Promise<OperationResult<EmployeeUpsertOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can upsert employees.", {
        operation: "employee.upsert",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: EmployeeUpsertInput;
  try {
    parsedInput = parseEmployeeUpsertInput(request.input);
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Invalid employee.upsert input."));
  }

  try {
    const output = await upsertEmployee({
      companyId: companyIdOrError,
      employeeId: parsedInput.employeeId,
      email: parsedInput.email,
      firstName: parsedInput.firstName,
      lastName: parsedInput.lastName,
      phone: parsedInput.phone,
      isActive: parsedInput.isActive,
    });
    return okResult(parseEmployeeUpsertOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to upsert employee."));
  }
};

export const runEmployeeListActive = async (
  request: DispatchOperationInput,
): Promise<OperationResult<EmployeeListActiveOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader"])) {
    return errorResult(
      createOperationError("forbidden", "Current role cannot list active employees.", {
        operation: "employee.listActive",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: EmployeeListActiveInput;
  try {
    parsedInput = parseEmployeeListActiveInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid employee.listActive input."),
    );
  }

  try {
    const output = await listActiveEmployees({
      companyId: parsedInput.companyId ?? companyIdOrError,
    });
    return okResult(parseEmployeeListActiveOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to list active employees."),
    );
  }
};

export const runOrgDepartmentMove = async (
  request: DispatchOperationInput,
): Promise<OperationResult<OrgDepartmentMoveOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can move employees between departments.", {
        operation: "org.department.move",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: OrgDepartmentMoveInput;
  try {
    parsedInput = parseOrgDepartmentMoveInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid org.department.move input."),
    );
  }

  try {
    const output = await moveEmployeeDepartment({
      companyId: companyIdOrError,
      employeeId: parsedInput.employeeId,
      toDepartmentId: parsedInput.toDepartmentId,
    });
    return okResult(parseOrgDepartmentMoveOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to move employee department."),
    );
  }
};

export const runOrgManagerSet = async (
  request: DispatchOperationInput,
): Promise<OperationResult<OrgManagerSetOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can set employee manager.", {
        operation: "org.manager.set",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: OrgManagerSetInput;
  try {
    parsedInput = parseOrgManagerSetInput(request.input);
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Invalid org.manager.set input."));
  }

  try {
    const output = await setEmployeeManager({
      companyId: companyIdOrError,
      employeeId: parsedInput.employeeId,
      managerEmployeeId: parsedInput.managerEmployeeId,
    });
    return okResult(parseOrgManagerSetOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to set employee manager."));
  }
};
