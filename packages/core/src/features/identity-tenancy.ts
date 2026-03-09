/**
 * Identity and tenancy feature-area entrypoint.
 * @docs .memory-bank/spec/security/auth-and-identity.md
 * @see .memory-bank/spec/security/rbac.md
 */
import {
  type CompanyUpdateProfileInput,
  type CompanyUpdateProfileOutput,
  type DispatchOperationInput,
  type IdentityProvisionAccessInput,
  type IdentityProvisionAccessOutput,
  type MembershipListInput,
  type MembershipListOutput,
  type OperationResult,
  type SystemPingOutput,
  createOperationError,
  errorFromUnknown,
  errorResult,
  okResult,
  parseCompanyUpdateProfileInput,
  parseCompanyUpdateProfileOutput,
  parseIdentityProvisionAccessInput,
  parseIdentityProvisionAccessOutput,
  parseMembershipListInput,
  parseMembershipListOutput,
  parseSystemPingInput,
  parseSystemPingOutput,
} from "@feedback-360/api-contract";
import { listMemberships, provisionIdentityAccess } from "@feedback-360/db";

import { ensureContextCompany } from "../shared/context";

export const runSystemPing = (input: unknown): OperationResult<SystemPingOutput> => {
  try {
    parseSystemPingInput(input);
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Invalid system.ping input."));
  }

  try {
    return okResult(
      parseSystemPingOutput({
        pong: "ok",
        timestamp: new Date().toISOString(),
      }),
    );
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid system.ping output payload."),
    );
  }
};

export const runCompanyUpdateProfile = (
  request: DispatchOperationInput,
): OperationResult<CompanyUpdateProfileOutput> => {
  if (request.context?.role !== "hr_admin") {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can update company profile.", {
        operation: "company.updateProfile",
      }),
    );
  }

  let parsedInput: CompanyUpdateProfileInput;
  try {
    parsedInput = parseCompanyUpdateProfileInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid company.updateProfile input."),
    );
  }

  try {
    return okResult(
      parseCompanyUpdateProfileOutput({
        companyId: parsedInput.companyId,
        name: parsedInput.name,
        updatedAt: new Date().toISOString(),
      }),
    );
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid company.updateProfile output payload."),
    );
  }
};

export const runMembershipList = async (
  request: DispatchOperationInput,
): Promise<OperationResult<MembershipListOutput>> => {
  const userId = request.context?.userId;
  if (!userId) {
    return errorResult(
      createOperationError("unauthenticated", "User context is required for membership list.", {
        operation: "membership.list",
      }),
    );
  }

  let parsedInput: MembershipListInput;
  try {
    parsedInput = parseMembershipListInput(request.input);
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Invalid membership.list input."));
  }

  try {
    const output = await listMemberships({
      userId,
      ...parsedInput,
    });
    return okResult(parseMembershipListOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to list memberships."));
  }
};

export const runIdentityProvisionAccess = async (
  request: DispatchOperationInput,
): Promise<OperationResult<IdentityProvisionAccessOutput>> => {
  if (request.context?.role !== "hr_admin") {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can provision identity access.", {
        operation: "identity.provisionAccess",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: IdentityProvisionAccessInput;
  try {
    parsedInput = parseIdentityProvisionAccessInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid identity.provisionAccess input."),
    );
  }

  try {
    const output = await provisionIdentityAccess({
      userId: parsedInput.userId,
      email: parsedInput.email,
      links: [
        {
          companyId: companyIdOrError,
          employeeId: parsedInput.employeeId,
          role: parsedInput.role,
        },
      ],
    });

    const link = output.links[0];
    if (!link) {
      throw createOperationError("invalid_input", "Identity provisioning returned no links.");
    }

    return okResult(
      parseIdentityProvisionAccessOutput({
        employeeId: parsedInput.employeeId,
        userId: parsedInput.userId,
        email: output.email,
        role: link.role,
        membershipId: link.membershipId,
        employeeUserLinkId: link.employeeUserLinkId,
      }),
    );
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to provision identity access."),
    );
  }
};
