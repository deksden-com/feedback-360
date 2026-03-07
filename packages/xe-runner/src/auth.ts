import { mkdir } from "node:fs/promises";
import { join } from "node:path";

import { type XeAuthIssueOutput, createOperationError } from "@feedback-360/api-contract";
import { request as playwrightRequest } from "@playwright/test";

import { getXeRunRegistry } from "./run-registry";

const ensureActorBinding = (bindings: Record<string, unknown>, actor: string) => {
  const actors = bindings.actors;
  if (typeof actors !== "object" || actors === null || Array.isArray(actors)) {
    throw createOperationError("not_found", "XE run has no actor bindings.");
  }

  const actorRecord = (actors as Record<string, unknown>)[actor];
  if (typeof actorRecord !== "object" || actorRecord === null || Array.isArray(actorRecord)) {
    throw createOperationError("not_found", "XE actor is not available in bindings.", { actor });
  }

  const actorBinding = actorRecord as Record<string, unknown>;
  const userId = actorBinding.userId;
  const email = actorBinding.email;
  if (typeof userId !== "string" || typeof email !== "string") {
    throw createOperationError("invalid_input", "XE actor binding is incomplete.", { actor });
  }

  return {
    userId,
    email,
  };
};

export const issueXeActorStorageState = async (input: {
  runId: string;
  actor: string;
  baseUrl: string;
}): Promise<XeAuthIssueOutput> => {
  const run = await getXeRunRegistry(input.runId);
  const actorBinding = ensureActorBinding(run.bindings as Record<string, unknown>, input.actor);
  const companyId = (run.bindings as Record<string, unknown>).company as
    | { id?: string }
    | undefined;
  if (!companyId?.id) {
    throw createOperationError("invalid_input", "XE run is missing company binding.");
  }

  await mkdir(join(run.workspacePath, "storage-state"), { recursive: true });
  const statePath = join(run.workspacePath, "storage-state", `${input.actor}.json`);

  const api = await playwrightRequest.newContext({
    baseURL: input.baseUrl,
    ignoreHTTPSErrors: true,
  });
  try {
    const loginResponse = await api.post("/api/dev/test-login", {
      data: {
        userId: actorBinding.userId,
      },
    });
    if (!loginResponse.ok()) {
      throw createOperationError("invalid_transition", "Failed to bootstrap XE test login.", {
        actor: input.actor,
        status: loginResponse.status(),
      });
    }

    const companyResponse = await api.post("/api/session/active-company", {
      data: {
        companyId: companyId.id,
      },
    });
    if (!companyResponse.ok()) {
      throw createOperationError("invalid_transition", "Failed to set XE active company.", {
        actor: input.actor,
        status: companyResponse.status(),
      });
    }

    await api.storageState({ path: statePath });
    return {
      actor: input.actor,
      format: "storage-state",
      path: statePath,
      baseUrl: input.baseUrl,
    };
  } finally {
    await api.dispose();
  }
};
