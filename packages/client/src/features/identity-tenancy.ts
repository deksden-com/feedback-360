import {
  type IdentityProvisionAccessInput,
  type IdentityProvisionAccessOutput,
  type MembershipListInput,
  type MembershipListOutput,
  type OperationContext,
  type OperationResult,
  errorFromUnknown,
  errorResult,
  parseIdentityProvisionAccessInput,
  parseIdentityProvisionAccessOutput,
  parseMembershipListInput,
  parseMembershipListOutput,
} from "@feedback-360/api-contract";

import type { ClientRuntime } from "../shared/runtime";

export type IdentityTenancyClientMethods = {
  membershipList(
    input?: MembershipListInput,
    context?: OperationContext,
  ): Promise<OperationResult<MembershipListOutput>>;
  identityProvisionAccess(
    input: IdentityProvisionAccessInput,
    context?: OperationContext,
  ): Promise<OperationResult<IdentityProvisionAccessOutput>>;
};

export const createIdentityTenancyClientMethods = (
  runtime: ClientRuntime,
): IdentityTenancyClientMethods => ({
  membershipList: async (input, context) => {
    let parsedInput: MembershipListInput;
    try {
      parsedInput = parseMembershipListInput(input ?? {});
    } catch (error) {
      return errorResult(errorFromUnknown(error, "invalid_input", "Invalid membershipList input."));
    }

    return runtime.invokeOperation({
      operation: "membership.list",
      input: parsedInput,
      context,
      parseOutput: parseMembershipListOutput,
    });
  },

  identityProvisionAccess: async (input, context) => {
    let parsedInput: IdentityProvisionAccessInput;
    try {
      parsedInput = parseIdentityProvisionAccessInput(input);
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid identityProvisionAccess input."),
      );
    }

    return runtime.invokeOperation({
      operation: "identity.provisionAccess",
      input: parsedInput,
      context,
      parseOutput: parseIdentityProvisionAccessOutput,
    });
  },
});
