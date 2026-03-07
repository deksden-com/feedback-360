import { afterEach, describe, expect, it, vi } from "vitest";

describe("XE token login route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("rejects requests when token is missing", async () => {
    vi.stubEnv("APP_ENV", "beta");
    const { POST } = await import("./route");

    const response = await POST(
      new Request("https://beta.go360go.ru/api/dev/xe-token-login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "token is required.",
    });
  });

  it("sets user and company cookies for valid token", async () => {
    vi.stubEnv("APP_ENV", "beta");
    vi.stubEnv("AI_WEBHOOK_SECRET", "ft020-xe-secret");

    const { issueXeLoginToken } = await import("@/features/xe-auth/lib/token");
    const { POST } = await import("./route");
    const token = issueXeLoginToken({
      runId: "RUN-001",
      actor: "subject",
      userId: "user-1",
      companyId: "company-1",
      ttlSeconds: 300,
    });

    const response = await POST(
      new Request("https://beta.go360go.ru/api/dev/xe-token-login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ token }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      runId: "RUN-001",
      actor: "subject",
      userId: "user-1",
      companyId: "company-1",
    });

    const setCookie = response.headers.getSetCookie().join("\n");
    expect(setCookie).toContain("go360go_user_id=user-1");
    expect(setCookie).toContain("go360go_active_company_id=company-1");
  });
});
