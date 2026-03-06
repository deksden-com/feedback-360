import { describe, expect, it } from "vitest";

import { createClient } from "./index";

describe("FT-0121 client campaign list/detail/draft operations", () => {
  it("maps campaign list/get/updateDraft and model.version.list through transport", async () => {
    const requests: Array<{
      operation: string;
      context?: { companyId?: string };
      input: unknown;
    }> = [];

    const client = createClient({
      invoke: async (request) => {
        requests.push({
          operation: request.operation,
          context: request.context,
          input: request.input,
        });

        if (request.operation === "model.version.list") {
          return {
            ok: true,
            data: {
              items: [
                {
                  modelVersionId: "model-version-1",
                  name: "Q1 Model",
                  kind: "indicators",
                  version: 1,
                  status: "published",
                  createdAt: "2026-03-06T09:00:00.000Z",
                },
              ],
            },
          };
        }

        if (request.operation === "campaign.list") {
          return {
            ok: true,
            data: {
              items: [
                {
                  campaignId: "campaign-main",
                  companyId: request.context?.companyId ?? "company-main",
                  name: "Q1 Campaign",
                  status: "draft",
                  modelVersionId: "model-version-1",
                  modelName: "Q1 Model",
                  modelKind: "indicators",
                  modelVersion: 1,
                  startAt: "2026-04-01T09:00:00.000Z",
                  endAt: "2026-04-30T18:00:00.000Z",
                  timezone: "Europe/Kaliningrad",
                  createdAt: "2026-03-06T10:00:00.000Z",
                  updatedAt: "2026-03-06T10:00:00.000Z",
                },
              ],
            },
          };
        }

        if (request.operation === "campaign.get") {
          return {
            ok: true,
            data: {
              campaignId: "campaign-main",
              companyId: request.context?.companyId ?? "company-main",
              name: "Q1 Campaign",
              status: "draft",
              modelVersionId: "model-version-1",
              modelName: "Q1 Model",
              modelKind: "indicators",
              modelVersion: 1,
              startAt: "2026-04-01T09:00:00.000Z",
              endAt: "2026-04-30T18:00:00.000Z",
              timezone: "Europe/Kaliningrad",
              createdAt: "2026-03-06T10:00:00.000Z",
              updatedAt: "2026-03-06T10:00:00.000Z",
              managerWeight: 40,
              peersWeight: 30,
              subordinatesWeight: 30,
              selfWeight: 0,
            },
          };
        }

        if (request.operation === "campaign.updateDraft") {
          return {
            ok: true,
            data: {
              campaignId: "campaign-main",
              companyId: request.context?.companyId ?? "company-main",
              modelVersionId: "model-version-1",
              name: "Q1 Campaign Updated",
              status: "draft",
              startAt: "2026-04-02T09:00:00.000Z",
              endAt: "2026-04-28T18:00:00.000Z",
              timezone: "Europe/Kaliningrad",
              changed: true,
              updatedAt: "2026-03-06T11:00:00.000Z",
            },
          };
        }

        return {
          ok: false,
          error: {
            code: "not_found",
            message: `Unexpected operation: ${request.operation}`,
          },
        };
      },
    });

    client.setActiveCompany("company-main");

    const models = await client.modelVersionList({});
    const list = await client.campaignList({ status: "draft" });
    const detail = await client.campaignGet({ campaignId: "campaign-main" });
    const updated = await client.campaignUpdateDraft({
      campaignId: "campaign-main",
      name: "Q1 Campaign Updated",
      modelVersionId: "model-version-1",
      startAt: "2026-04-02T09:00:00.000Z",
      endAt: "2026-04-28T18:00:00.000Z",
      timezone: "Europe/Kaliningrad",
    });

    expect(models.ok).toBe(true);
    expect(list.ok).toBe(true);
    expect(detail.ok).toBe(true);
    expect(updated.ok).toBe(true);
    expect(requests.map((item) => item.operation)).toEqual([
      "model.version.list",
      "campaign.list",
      "campaign.get",
      "campaign.updateDraft",
    ]);
  });
});
