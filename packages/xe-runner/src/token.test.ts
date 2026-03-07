import { afterEach, describe, expect, it, vi } from "vitest";

import { issueXeLoginToken, verifyXeLoginToken } from "./token";

describe("XE login token helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("issues and verifies signed token payload", () => {
    vi.stubEnv("AI_WEBHOOK_SECRET", "ft020-token-secret");

    const token = issueXeLoginToken({
      runId: "RUN-001",
      actor: "subject",
      userId: "user-1",
      companyId: "company-1",
      ttlSeconds: 300,
    });

    const payload = verifyXeLoginToken(token);
    expect(payload).toMatchObject({
      runId: "RUN-001",
      actor: "subject",
      userId: "user-1",
      companyId: "company-1",
    });
  });
});
