import { describe, expect, it } from "vitest";

import { dispatchOperation } from "@feedback-360/core";

import {
  type OperationTransport,
  createClient,
  createHttpTransport,
  createInprocTransport,
} from "./index";

describe("FT-0012 active company context", () => {
  it("does not call transport when setting active company", () => {
    let transportCalls = 0;

    const transport: OperationTransport = {
      invoke: async () => {
        transportCalls += 1;
        return {
          ok: true,
          data: {
            pong: "ok",
            timestamp: "2026-01-01T00:00:00.000Z",
          },
        };
      },
    };

    const client = createClient(transport);
    const setResult = client.setActiveCompany("company-main");

    expect(setResult.ok).toBe(true);
    expect(client.getActiveCompany()).toBe("company-main");
    expect(transportCalls).toBe(0);
  });

  it("propagates active company context equally for HTTP and in-proc", async () => {
    const inprocRequests: Array<{ context?: { companyId?: string } }> = [];
    const baseInprocTransport = createInprocTransport();
    const inprocTransport: OperationTransport = {
      invoke: async (request) => {
        inprocRequests.push({ context: { companyId: request.context?.companyId } });
        return baseInprocTransport.invoke(request);
      },
    };

    const httpRequests: Array<{ context?: { companyId?: string } }> = [];
    const httpTransport = createHttpTransport({
      baseUrl: "https://feedback-360.local",
      fetchFn: async (_url, init) => {
        const body = JSON.parse(String(init?.body ?? "{}")) as {
          operation: string;
          input: unknown;
          context?: { companyId?: string };
        };
        httpRequests.push({ context: body.context });

        return {
          json: async () =>
            dispatchOperation({
              operation: body.operation,
              input: body.input,
              context: body.context,
            }),
        };
      },
    });

    const inprocClient = createClient(inprocTransport);
    const httpClient = createClient(httpTransport);

    inprocClient.setActiveCompany("company-active");
    httpClient.setActiveCompany("company-active");

    await inprocClient.systemPing();
    await httpClient.systemPing();

    expect(inprocRequests[0]?.context?.companyId).toBe("company-active");
    expect(httpRequests[0]?.context?.companyId).toBe("company-active");
  });
});
