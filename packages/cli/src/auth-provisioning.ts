import {
  type MembershipRole,
  createOperationError,
  membershipRoles,
} from "@feedback-360/api-contract";
import { type IdentityProvisionLinkInput, provisionIdentityAccess } from "@feedback-360/db";

type ProvisionTarget = "beta" | "prod";

export type ProvisionAuthEmailAccessInput = {
  email: string;
  userId: string;
  links: IdentityProvisionLinkInput[];
  target: ProvisionTarget;
  projectRef?: string;
};

type UpsertSupabaseAuthUserOutput = {
  userId: string;
  email: string;
  authAction: "created" | "updated";
};

export type ProvisionAuthEmailAccessOutput = UpsertSupabaseAuthUserOutput & {
  target: ProvisionTarget;
  projectRef: string;
  links: Array<{
    companyId: string;
    employeeId: string;
    role: MembershipRole;
    membershipId: string;
    employeeUserLinkId: string;
  }>;
};

type SupabaseApiKey = {
  name: string;
  api_key: string;
};

type SupabaseAdminUserResponse = {
  id: string;
  email?: string;
};

const normalizeEmail = (value: string): string => {
  return value.trim().toLowerCase();
};

const resolvePoolerUrlForTarget = (target: ProvisionTarget): string => {
  const value =
    target === "prod"
      ? (process.env.SUPABASE_PROD_DB_POOLER_URL ?? process.env.SUPABASE_DB_POOLER_URL)
      : (process.env.SUPABASE_BETA_DB_POOLER_URL ?? process.env.SUPABASE_DB_POOLER_URL);

  if (!value) {
    throw createOperationError(
      "invalid_input",
      `SUPABASE_${target.toUpperCase()}_DB_POOLER_URL is required for target ${target}.`,
    );
  }

  return value;
};

const deriveProjectRefFromPoolerUrl = (poolerUrl: string): string | undefined => {
  try {
    const parsedUrl = new URL(poolerUrl);
    const match = parsedUrl.username.match(/^postgres\.([a-z0-9]+)$/i);
    return match?.[1];
  } catch {
    return undefined;
  }
};

const resolveProjectRef = (
  target: ProvisionTarget,
  poolerUrl: string,
  override?: string,
): string => {
  const projectRef = override?.trim() || deriveProjectRefFromPoolerUrl(poolerUrl);
  if (!projectRef) {
    throw createOperationError(
      "invalid_input",
      `Project ref is required for target ${target}. Pass --project-ref explicitly.`,
    );
  }
  return projectRef;
};

const fetchServiceRoleKey = async (projectRef: string): Promise<string> => {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  if (!accessToken) {
    throw createOperationError(
      "invalid_input",
      "SUPABASE_ACCESS_TOKEN is required for Supabase management API access.",
    );
  }

  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
  });

  if (!response.ok) {
    throw createOperationError(
      "invalid_input",
      `Failed to load Supabase API keys for project ${projectRef}.`,
      {
        httpStatus: response.status,
      },
    );
  }

  const payload = (await response.json()) as SupabaseApiKey[];
  const serviceRoleKey = payload.find((item) => item.name === "service_role")?.api_key;
  if (!serviceRoleKey) {
    throw createOperationError(
      "invalid_input",
      `service_role key is not available for project ${projectRef}.`,
    );
  }

  return serviceRoleKey;
};

const getAuthUserById = async (
  projectRef: string,
  serviceRoleKey: string,
  userId: string,
): Promise<SupabaseAdminUserResponse | undefined> => {
  const response = await fetch(`https://${projectRef}.supabase.co/auth/v1/admin/users/${userId}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
    },
  });

  if (response.status === 404) {
    return undefined;
  }

  if (!response.ok) {
    throw createOperationError(
      "invalid_input",
      `Failed to load auth user ${userId} in project ${projectRef}.`,
      {
        httpStatus: response.status,
      },
    );
  }

  return (await response.json()) as SupabaseAdminUserResponse;
};

const updateAuthUser = async (
  projectRef: string,
  serviceRoleKey: string,
  userId: string,
  email: string,
): Promise<void> => {
  const response = await fetch(`https://${projectRef}.supabase.co/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email,
      email_confirm: true,
    }),
  });

  if (!response.ok) {
    throw createOperationError("invalid_input", `Failed to update auth user ${userId}.`, {
      httpStatus: response.status,
    });
  }
};

const createAuthUser = async (
  projectRef: string,
  serviceRoleKey: string,
  userId: string,
  email: string,
): Promise<void> => {
  const response = await fetch(`https://${projectRef}.supabase.co/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      id: userId,
      email,
      email_confirm: true,
      user_metadata: {
        source: "feedback360-cli-auth-provision",
      },
    }),
  });

  if (!response.ok) {
    throw createOperationError("invalid_input", `Failed to create auth user ${userId}.`, {
      httpStatus: response.status,
    });
  }
};

const upsertSupabaseAuthUser = async (
  projectRef: string,
  userId: string,
  email: string,
): Promise<UpsertSupabaseAuthUserOutput> => {
  const serviceRoleKey = await fetchServiceRoleKey(projectRef);
  const existingUser = await getAuthUserById(projectRef, serviceRoleKey, userId);

  if (!existingUser) {
    await createAuthUser(projectRef, serviceRoleKey, userId, email);
    return {
      userId,
      email,
      authAction: "created",
    };
  }

  if (existingUser.email !== email) {
    await updateAuthUser(projectRef, serviceRoleKey, userId, email);
    return {
      userId,
      email,
      authAction: "updated",
    };
  }

  return {
    userId,
    email,
    authAction: "updated",
  };
};

export const parseProvisionLinksJson = (value: string): IdentityProvisionLinkInput[] => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch (error: unknown) {
    throw createOperationError("invalid_input", "Invalid --links-json value.", {
      reason: error instanceof Error ? error.message : "unknown",
    });
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw createOperationError(
      "invalid_input",
      "--links-json must be a non-empty array of company/employee links.",
    );
  }

  return parsed.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw createOperationError(
        "invalid_input",
        `Link at index ${index} must be an object with companyId, employeeId, role.`,
      );
    }

    const candidate = entry as {
      companyId?: unknown;
      employeeId?: unknown;
      role?: unknown;
    };

    const companyId = typeof candidate.companyId === "string" ? candidate.companyId.trim() : "";
    const employeeId = typeof candidate.employeeId === "string" ? candidate.employeeId.trim() : "";
    const role = typeof candidate.role === "string" ? candidate.role.trim() : "";

    if (!companyId || !employeeId || !role) {
      throw createOperationError(
        "invalid_input",
        `Link at index ${index} must contain non-empty companyId, employeeId and role.`,
      );
    }

    if (!membershipRoles.includes(role as MembershipRole)) {
      throw createOperationError(
        "invalid_input",
        `Link at index ${index} has invalid role. Allowed roles: ${membershipRoles.join(", ")}.`,
      );
    }

    return {
      companyId,
      employeeId,
      role: role as MembershipRole,
    };
  });
};

export const provisionAuthEmailAccess = async (
  input: ProvisionAuthEmailAccessInput,
): Promise<ProvisionAuthEmailAccessOutput> => {
  const email = normalizeEmail(input.email);
  if (!email) {
    throw createOperationError("invalid_input", "--email is required.");
  }

  const userId = input.userId.trim();
  if (!userId) {
    throw createOperationError("invalid_input", "--user-id is required.");
  }

  const poolerUrl = resolvePoolerUrlForTarget(input.target);
  const projectRef = resolveProjectRef(input.target, poolerUrl, input.projectRef);
  process.env.SUPABASE_DB_POOLER_URL = poolerUrl;

  const authUser = await upsertSupabaseAuthUser(projectRef, userId, email);
  const identityAccess = await provisionIdentityAccess({
    userId,
    email,
    links: input.links,
  });

  return {
    ...authUser,
    target: input.target,
    projectRef,
    links: identityAccess.links,
  };
};
