import { describe, expect, it } from "vitest";

import { dispatchOperation } from "@feedback-360/core";

import { createClient, createHttpTransport, createInprocTransport } from "./index";

describe("FT-0012 transport parity", () => {
  it("returns equivalent system.ping result for HTTP and in-proc transports", async () => {
    const inprocClient = createClient(createInprocTransport());

    const httpTransport = createHttpTransport({
      baseUrl: "https://feedback-360.local",
      fetchFn: async (_url, init) => {
        const body = JSON.parse(String(init?.body ?? "{}")) as {
          operation: string;
          input: unknown;
          context?: unknown;
        };

        const responsePayload = dispatchOperation({
          operation: body.operation,
          input: body.input,
          context: body.context as never,
        });

        return {
          json: async () => responsePayload,
        };
      },
    });
    const httpClient = createClient(httpTransport);

    const inprocResult = await inprocClient.systemPing();
    const httpResult = await httpClient.systemPing();

    expect(inprocResult.ok).toBe(true);
    expect(httpResult.ok).toBe(true);

    if (inprocResult.ok && httpResult.ok) {
      expect(inprocResult.data.pong).toBe("ok");
      expect(httpResult.data.pong).toBe("ok");
      expect(typeof inprocResult.data.timestamp).toBe("string");
      expect(typeof httpResult.data.timestamp).toBe("string");
    }
  });
});
