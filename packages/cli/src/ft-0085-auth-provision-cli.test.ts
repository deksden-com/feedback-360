import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("FT-0085 CLI auth provision command", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    process.exitCode = undefined;
    process.env.SUPABASE_ACCESS_TOKEN = "token-test";
    process.env.SUPABASE_BETA_DB_POOLER_URL =
      "postgresql://postgres.fwgmltdbnbuugwskhoie:password@aws-1-eu-central-1.pooler.supabase.com:6543/postgres";
  });

  afterEach(() => {
    process.exitCode = undefined;
    process.env.SUPABASE_ACCESS_TOKEN = undefined;
    process.env.SUPABASE_BETA_DB_POOLER_URL = undefined;
  });

  it("provisions auth user and company links", async () => {
    vi.doMock("@feedback-360/client", () => {
      return {
        createInprocClient: () => {
          throw new Error("createInprocClient should not be used in auth provision command.");
        },
      };
    });

    const provisionIdentityAccessMock = vi.fn(async () => ({
      userId: "18000000-0000-4000-8000-000000000010",
      email: "deksden@deksden.com",
      links: [
        {
          companyId: "10000000-0000-4000-8000-000000000010",
          employeeId: "12000000-0000-4000-8000-000000000010",
          role: "hr_admin" as const,
          membershipId: "membership-1",
          employeeUserLinkId: "employee-link-1",
        },
      ],
    }));

    vi.doMock("@feedback-360/db", () => {
      return {
        provisionIdentityAccess: provisionIdentityAccessMock,
      };
    });

    const fetchMock = vi.fn(async (input: string, init?: { method?: string }) => {
      if (input.includes("/api-keys")) {
        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              name: "service_role",
              api_key: "service-key-test",
            },
          ],
        };
      }

      if (
        input.includes("/auth/v1/admin/users/18000000-0000-4000-8000-000000000010") &&
        !init?.method
      ) {
        return {
          ok: false,
          status: 404,
          json: async () => ({}),
        };
      }

      if (input.endsWith("/auth/v1/admin/users") && init?.method === "POST") {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: "18000000-0000-4000-8000-000000000010",
          }),
        };
      }

      throw new Error(`Unexpected fetch call in test: ${input}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { runCli } = await import("./index");
    await runCli([
      "node",
      "feedback360",
      "auth",
      "provision-email",
      "--target",
      "beta",
      "--email",
      "deksden@deksden.com",
      "--user-id",
      "18000000-0000-4000-8000-000000000010",
      "--links-json",
      '[{"companyId":"10000000-0000-4000-8000-000000000010","employeeId":"12000000-0000-4000-8000-000000000010","role":"hr_admin"}]',
    ]);

    expect(errorSpy).not.toHaveBeenCalled();
    expect(process.exitCode).toBeUndefined();
    expect(provisionIdentityAccessMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalled();

    const output = logSpy.mock.calls.map((call) => String(call[0] ?? "")).join("\n");
    expect(output).toContain("Auth provisioned:");
    expect(output).toContain("deksden@deksden.com");
  });
});
