import { beforeEach, describe, expect, it, vi } from "vitest";

const listMembershipsMock = vi.fn(async () => ({
  items: [
    {
      companyId: "company-a",
      companyName: "Company A",
      role: "hr_admin" as const,
    },
    {
      companyId: "company-b",
      companyName: "Company B",
      role: "employee" as const,
    },
  ],
}));

vi.mock("@feedback-360/db", () => {
  return {
    listMemberships: listMembershipsMock,
  };
});

describe("FT-0081 membership.list (no-db)", () => {
  beforeEach(() => {
    listMembershipsMock.mockClear();
  });

  it("returns unauthenticated when user context is missing", async () => {
    const { dispatchOperation } = await import("../index");

    const result = await dispatchOperation({
      operation: "membership.list",
      input: {},
      context: {
        role: "employee",
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("unauthenticated");
    }
    expect(listMembershipsMock).not.toHaveBeenCalled();
  });

  it("lists memberships for current user", async () => {
    const { dispatchOperation } = await import("../index");

    const result = await dispatchOperation({
      operation: "membership.list",
      input: {},
      context: {
        userId: "user-1",
      },
    });

    expect(result.ok).toBe(true);
    expect(listMembershipsMock).toHaveBeenCalledTimes(1);
    expect(listMembershipsMock).toHaveBeenCalledWith({
      userId: "user-1",
    });

    if (result.ok && "items" in result.data) {
      expect(result.data.items).toHaveLength(2);
      const companyIds = result.data.items
        .map((item) => ("companyId" in item ? item.companyId : undefined))
        .filter((value): value is string => typeof value === "string");

      expect(companyIds).toEqual(["company-a", "company-b"]);
    }
  });
});
