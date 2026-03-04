import { describe, expect, it } from "vitest";

import { dispatchOperation } from "../index";

describe("FT-0011 operation plumbing + typed errors", () => {
  it("returns invalid_input for schema violations", async () => {
    const result = await dispatchOperation({
      operation: "system.ping",
      input: { unexpected: true },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("invalid_input");
    }
  });

  it("returns forbidden for write operation when role has no access", async () => {
    const result = await dispatchOperation({
      operation: "company.updateProfile",
      input: {
        companyId: "company-1",
        name: "New company name",
      },
      context: {
        role: "employee",
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("forbidden");
    }
  });

  it("returns validated output for happy-path dispatch", async () => {
    const result = await dispatchOperation({
      operation: "company.updateProfile",
      input: {
        companyId: "company-1",
        name: "Updated company",
      },
      context: {
        role: "hr_admin",
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok && "companyId" in result.data && "updatedAt" in result.data) {
      expect("name" in result.data).toBe(true);
      if (!("name" in result.data)) {
        return;
      }
      expect(result.data.companyId).toBe("company-1");
      expect(result.data.name).toBe("Updated company");
      expect(typeof result.data.updatedAt).toBe("string");
    }
  });

  it("returns typed not_found for unknown operation", async () => {
    const result = await dispatchOperation({
      operation: "operation.unknown",
      input: {},
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("not_found");
    }
  });
});
