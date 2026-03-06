import { describe, expect, it } from "vitest";

import { createRequestTrace, extendRequestTrace, jsonWithRequestTrace } from "./observability";

describe("FT-0102 observability helpers", () => {
  it("reuses inbound request id and mirrors it into response headers", async () => {
    const request = new Request("http://localhost/api/example", {
      method: "POST",
      headers: {
        "x-request-id": "req-ft-0102-1",
      },
    });

    const trace = createRequestTrace(request, {
      route: "/api/example",
      metadata: {
        action: "demo",
      },
    });
    const response = jsonWithRequestTrace(
      trace,
      {
        ok: true,
      },
      { status: 200 },
    );

    expect(trace.requestId).toBe("req-ft-0102-1");
    expect(response.headers.get("x-request-id")).toBe("req-ft-0102-1");
    expect(response.headers.get("x-correlation-id")).toBe("req-ft-0102-1");
  });

  it("extends request metadata without changing request id", () => {
    const trace = createRequestTrace(new Request("http://localhost/api/example"), {
      route: "/api/example",
    });
    const extended = extendRequestTrace(trace, {
      campaignId: "campaign-main",
      role: "hr_admin",
    });

    expect(extended.requestId).toBe(trace.requestId);
    expect(extended.metadata.campaignId).toBe("campaign-main");
    expect(extended.metadata.role).toBe("hr_admin");
  });
});
