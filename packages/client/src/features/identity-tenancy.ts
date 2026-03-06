import {
  type MembershipListInput,
  type MembershipListOutput,
  type OperationContext,
  type OperationResult,
  errorFromUnknown,
  errorResult,
  parseMembershipListInput,
  parseMembershipListOutput,
} from "@feedback-360/api-contract";

import type { ClientRuntime } from "../shared/runtime";

export type IdentityTenancyClientMethods = {
  membershipList(
    input?: MembershipListInput,
    context?: OperationContext,
  ): Promise<OperationResult<MembershipListOutput>>;
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
});
