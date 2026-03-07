import {
  type DispatchOperationInput,
  type OperationResult,
  createOperationError,
  errorResult,
} from "@feedback-360/api-contract";
import { getEmployeeIdByUserInCompany } from "@feedback-360/db";

export const ensureContextCompany = (
  request: DispatchOperationInput,
): string | OperationResult<never> => {
  const companyId = request.context?.companyId;
  if (!companyId) {
    return errorResult(
      createOperationError("forbidden", "Active company is required for this operation."),
    );
  }

  return companyId;
};

export const hasRole = (
  request: DispatchOperationInput,
  allowedRoles: readonly string[],
): boolean => {
  const role = request.context?.role;
  return Boolean(role && allowedRoles.includes(role));
};

export const resolveRaterEmployeeId = async (
  request: DispatchOperationInput,
  companyId: string,
  operation: string,
): Promise<string | undefined | OperationResult<never>> => {
  const role = request.context?.role;
  if (role !== "manager" && role !== "employee") {
    return undefined;
  }

  const contextEmployeeId = request.context?.employeeId;
  if (contextEmployeeId) {
    return contextEmployeeId;
  }

  const userId = request.context?.userId;
  if (!userId) {
    return errorResult(
      createOperationError(
        "unauthenticated",
        "User context is required for questionnaire access.",
        {
          operation,
        },
      ),
    );
  }

  const employeeId = await getEmployeeIdByUserInCompany({
    companyId,
    userId,
  });

  if (!employeeId) {
    return errorResult(
      createOperationError("forbidden", "No employee profile linked to current user.", {
        operation,
        companyId,
        userId,
      }),
    );
  }

  return employeeId;
};
