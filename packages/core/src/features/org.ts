import {
  type DepartmentListInput,
  type DepartmentListOutput,
  type DepartmentUpsertInput,
  type DepartmentUpsertOutput,
  type DispatchOperationInput,
  type EmployeeDirectoryListInput,
  type EmployeeDirectoryListOutput,
  type EmployeeListActiveInput,
  type EmployeeListActiveOutput,
  type EmployeeProfileGetInput,
  type EmployeeProfileGetOutput,
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
import {
  getEmployeeProfile,
  listActiveEmployees,
  listDepartments,
  listEmployeeDirectory,
  moveEmployeeDepartment,
  setEmployeeManager,
  upsertDepartment,
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
      telegramUserId: parsedInput.telegramUserId,
      telegramChatId: parsedInput.telegramChatId,
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

export const runEmployeeDirectoryList = async (
  request: DispatchOperationInput,
): Promise<OperationResult<EmployeeDirectoryListOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader"])) {
    return errorResult(
      createOperationError("forbidden", "Current role cannot open employee directory.", {
        operation: "employee.directoryList",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: EmployeeDirectoryListInput;
  try {
    parsedInput = parseEmployeeDirectoryListInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid employee.directoryList input."),
    );
  }

  try {
    const output = await listEmployeeDirectory({
      companyId: parsedInput.companyId ?? companyIdOrError,
      ...(parsedInput.search ? { search: parsedInput.search } : {}),
      ...(parsedInput.departmentId ? { departmentId: parsedInput.departmentId } : {}),
      ...(parsedInput.status ? { status: parsedInput.status } : {}),
    });
    return okResult(parseEmployeeDirectoryListOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to load employee directory."),
    );
  }
};

export const runEmployeeProfileGet = async (
  request: DispatchOperationInput,
): Promise<OperationResult<EmployeeProfileGetOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader"])) {
    return errorResult(
      createOperationError("forbidden", "Current role cannot open employee profile.", {
        operation: "employee.profileGet",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: EmployeeProfileGetInput;
  try {
    parsedInput = parseEmployeeProfileGetInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid employee.profileGet input."),
    );
  }

  try {
    const output = await getEmployeeProfile({
      companyId: companyIdOrError,
      employeeId: parsedInput.employeeId,
    });
    return okResult(parseEmployeeProfileGetOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to load employee profile."),
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

export const runDepartmentList = async (
  request: DispatchOperationInput,
): Promise<OperationResult<DepartmentListOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader"])) {
    return errorResult(
      createOperationError("forbidden", "Current role cannot list departments.", {
        operation: "department.list",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: DepartmentListInput;
  try {
    parsedInput = parseDepartmentListInput(request.input);
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Invalid department.list input."));
  }

  try {
    const output = await listDepartments({
      companyId: parsedInput.companyId ?? companyIdOrError,
      ...(parsedInput.includeInactive !== undefined
        ? { includeInactive: parsedInput.includeInactive }
        : {}),
    });
    return okResult(parseDepartmentListOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to list departments."));
  }
};

export const runDepartmentUpsert = async (
  request: DispatchOperationInput,
): Promise<OperationResult<DepartmentUpsertOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can change departments.", {
        operation: "department.upsert",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: DepartmentUpsertInput;
  try {
    parsedInput = parseDepartmentUpsertInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid department.upsert input."),
    );
  }

  try {
    const output = await upsertDepartment({
      companyId: companyIdOrError,
      departmentId: parsedInput.departmentId,
      name: parsedInput.name,
      ...(parsedInput.parentDepartmentId
        ? { parentDepartmentId: parsedInput.parentDepartmentId }
        : {}),
      ...(parsedInput.isActive !== undefined ? { isActive: parsedInput.isActive } : {}),
    });
    return okResult(parseDepartmentUpsertOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to upsert department."));
  }
};
