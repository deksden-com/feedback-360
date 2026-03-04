import { hasDatabaseUrl, runSeedScenario } from "@feedback-360/db";
import { describe, expect, it } from "vitest";

import { dispatchOperation } from "../index";

const hasUrl = hasDatabaseUrl();

describe("FT-0042 campaign lifecycle transitions", () => {
  it.runIf(hasUrl)("enforces state transitions with idempotent start/end", async () => {
    const seeded = await runSeedScenario({
      scenario: "S4_campaign_draft",
      variant: "no_participants",
    });

    const companyId = seeded.handles["company.main"];
    const campaignId = seeded.handles["campaign.main"];
    expect(companyId).toBeDefined();
    expect(campaignId).toBeDefined();

    if (!companyId || !campaignId) {
      return;
    }

    const context = {
      companyId,
      role: "hr_admin" as const,
    };

    const startOnce = await dispatchOperation({
      operation: "campaign.start",
      input: { campaignId },
      context,
    });
    expect(startOnce.ok).toBe(true);
    if (
      startOnce.ok &&
      "status" in startOnce.data &&
      "previousStatus" in startOnce.data &&
      "changed" in startOnce.data
    ) {
      expect(startOnce.data.previousStatus).toBe("draft");
      expect(startOnce.data.status).toBe("started");
      expect(startOnce.data.changed).toBe(true);
    }

    const startTwice = await dispatchOperation({
      operation: "campaign.start",
      input: { campaignId },
      context,
    });
    expect(startTwice.ok).toBe(true);
    if (
      startTwice.ok &&
      "status" in startTwice.data &&
      "previousStatus" in startTwice.data &&
      "changed" in startTwice.data
    ) {
      expect(startTwice.data.previousStatus).toBe("started");
      expect(startTwice.data.status).toBe("started");
      expect(startTwice.data.changed).toBe(false);
    }

    const endOnce = await dispatchOperation({
      operation: "campaign.end",
      input: { campaignId },
      context,
    });
    expect(endOnce.ok).toBe(true);
    if (
      endOnce.ok &&
      "status" in endOnce.data &&
      "previousStatus" in endOnce.data &&
      "changed" in endOnce.data
    ) {
      expect(endOnce.data.previousStatus).toBe("started");
      expect(endOnce.data.status).toBe("ended");
      expect(endOnce.data.changed).toBe(true);
    }

    const stopTwice = await dispatchOperation({
      operation: "campaign.stop",
      input: { campaignId },
      context,
    });
    expect(stopTwice.ok).toBe(true);
    if (
      stopTwice.ok &&
      "status" in stopTwice.data &&
      "previousStatus" in stopTwice.data &&
      "changed" in stopTwice.data
    ) {
      expect(stopTwice.data.previousStatus).toBe("ended");
      expect(stopTwice.data.status).toBe("ended");
      expect(stopTwice.data.changed).toBe(false);
    }

    const startAfterEnded = await dispatchOperation({
      operation: "campaign.start",
      input: { campaignId },
      context,
    });
    expect(startAfterEnded.ok).toBe(false);
    if (!startAfterEnded.ok) {
      expect(startAfterEnded.error.code).toBe("invalid_transition");
    }
  });

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});
