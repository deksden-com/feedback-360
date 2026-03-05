import type { MembershipRole } from "@feedback-360/api-contract";
import { createInprocClient } from "@feedback-360/client";

import { getAppSession } from "./app-session";

export type AppOperationContext = {
  userId: string;
  companyId: string;
  role: MembershipRole;
};

type ResolveContextError = {
  code: "unauthenticated" | "active_company_required" | "forbidden" | "invalid_input";
  message: string;
};

export type ResolveOperationContextResult =
  | {
      ok: true;
      context: AppOperationContext;
    }
  | {
      ok: false;
      error: ResolveContextError;
    };

export const resolveAppOperationContext = async (): Promise<ResolveOperationContextResult> => {
  const session = await getAppSession();
  if (!session.userId) {
    return {
      ok: false,
      error: {
        code: "unauthenticated",
        message: "Login is required.",
      },
    };
  }

  if (!session.activeCompanyId) {
    return {
      ok: false,
      error: {
        code: "active_company_required",
        message: "Active company is required.",
      },
    };
  }

  const client = createInprocClient();
  const memberships = await client.membershipList(
    {},
    {
      userId: session.userId,
    },
  );

  if (!memberships.ok) {
    return {
      ok: false,
      error: {
        code: memberships.error.code === "invalid_input" ? "invalid_input" : "forbidden",
        message: memberships.error.message,
      },
    };
  }

  const activeMembership = memberships.data.items.find(
    (item) => item.companyId === session.activeCompanyId,
  );
  if (!activeMembership) {
    return {
      ok: false,
      error: {
        code: "forbidden",
        message: "Active company is not available for current user.",
      },
    };
  }

  return {
    ok: true,
    context: {
      userId: session.userId,
      companyId: session.activeCompanyId,
      role: activeMembership.role,
    },
  };
};
