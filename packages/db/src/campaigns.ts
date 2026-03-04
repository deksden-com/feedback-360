import { createOperationError } from "@feedback-360/api-contract";
import { and, eq } from "drizzle-orm";

import { createDb, createPool } from "./db";
import { campaigns, companies, competencyModelVersions } from "./schema";

type CreateCampaignInput = {
  companyId: string;
  modelVersionId: string;
  name: string;
  startAt: string;
  endAt: string;
  timezone?: string;
};

export type CreateCampaignOutput = {
  campaignId: string;
  companyId: string;
  modelVersionId: string;
  name: string;
  status: "draft";
  startAt: string;
  endAt: string;
  timezone: string;
  createdAt: string;
};

type CampaignLifecycleStatus =
  | "draft"
  | "started"
  | "ended"
  | "processing_ai"
  | "ai_failed"
  | "completed";

type TransitionCampaignStatusInput = {
  companyId: string;
  campaignId: string;
  targetStatus: "started" | "ended";
};

export type TransitionCampaignStatusOutput = {
  campaignId: string;
  previousStatus: CampaignLifecycleStatus;
  status: CampaignLifecycleStatus;
  changed: boolean;
  updatedAt: string;
};

export type CampaignSetModelVersionOutput = {
  campaignId: string;
  modelVersionId: string;
  changed: boolean;
  updatedAt: string;
};

export type CampaignWeightsSetOutput = {
  campaignId: string;
  manager: number;
  peers: number;
  subordinates: number;
  self: 0;
  changed: boolean;
  updatedAt: string;
};

const parseTimestamp = (value: string, fieldName: string): Date => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw createOperationError(
      "invalid_input",
      `${fieldName} must be a valid ISO datetime string.`,
    );
  }
  return parsed;
};

const ensureCampaignLifecycleStatus = (value: string): CampaignLifecycleStatus => {
  if (
    value === "draft" ||
    value === "started" ||
    value === "ended" ||
    value === "processing_ai" ||
    value === "ai_failed" ||
    value === "completed"
  ) {
    return value;
  }

  throw createOperationError("invalid_input", "Unsupported campaign status.", {
    status: value,
  });
};

const transitionCampaignStatus = async (
  input: TransitionCampaignStatusInput,
): Promise<TransitionCampaignStatusOutput> => {
  const pool = createPool();
  try {
    const db = createDb(pool);

    return await db.transaction(async (tx) => {
      const campaignRows = await tx
        .select({
          campaignId: campaigns.id,
          companyId: campaigns.companyId,
          status: campaigns.status,
        })
        .from(campaigns)
        .where(and(eq(campaigns.id, input.campaignId), eq(campaigns.companyId, input.companyId)))
        .limit(1);

      const campaign = campaignRows[0];
      if (!campaign) {
        throw createOperationError("not_found", "Campaign not found in active company.", {
          campaignId: input.campaignId,
          companyId: input.companyId,
        });
      }

      const previousStatus = ensureCampaignLifecycleStatus(campaign.status);
      const now = new Date();

      if (input.targetStatus === "started") {
        if (previousStatus === "started") {
          return {
            campaignId: input.campaignId,
            previousStatus,
            status: "started",
            changed: false,
            updatedAt: now.toISOString(),
          };
        }

        if (previousStatus !== "draft") {
          throw createOperationError(
            "invalid_transition",
            "Campaign can be started only from draft.",
            {
              campaignId: input.campaignId,
              status: previousStatus,
            },
          );
        }
      }

      if (input.targetStatus === "ended") {
        if (previousStatus === "ended") {
          return {
            campaignId: input.campaignId,
            previousStatus,
            status: "ended",
            changed: false,
            updatedAt: now.toISOString(),
          };
        }

        if (previousStatus !== "started") {
          throw createOperationError(
            "invalid_transition",
            "Campaign can be ended only from started.",
            {
              campaignId: input.campaignId,
              status: previousStatus,
            },
          );
        }
      }

      const updatedRows = await tx
        .update(campaigns)
        .set({
          status: input.targetStatus,
          updatedAt: now,
        })
        .where(eq(campaigns.id, input.campaignId))
        .returning({
          status: campaigns.status,
          updatedAt: campaigns.updatedAt,
        });

      const updated = updatedRows[0];
      if (!updated) {
        throw createOperationError("invalid_transition", "Failed to update campaign status.");
      }

      return {
        campaignId: input.campaignId,
        previousStatus,
        status: ensureCampaignLifecycleStatus(updated.status),
        changed: true,
        updatedAt: updated.updatedAt.toISOString(),
      };
    });
  } finally {
    await pool.end();
  }
};

export const createCampaign = async (input: CreateCampaignInput): Promise<CreateCampaignOutput> => {
  const name = input.name.trim();
  if (name.length === 0) {
    throw createOperationError("invalid_input", "Campaign name must be non-empty.");
  }

  const startAt = parseTimestamp(input.startAt, "startAt");
  const endAt = parseTimestamp(input.endAt, "endAt");
  if (endAt <= startAt) {
    throw createOperationError("invalid_input", "endAt must be greater than startAt.");
  }

  const pool = createPool();
  try {
    const db = createDb(pool);
    return await db.transaction(async (tx) => {
      const companyRows = await tx
        .select({
          timezone: companies.timezone,
        })
        .from(companies)
        .where(eq(companies.id, input.companyId))
        .limit(1);

      const company = companyRows[0];
      if (!company) {
        throw createOperationError("not_found", "Company not found.", {
          companyId: input.companyId,
        });
      }

      const modelRows = await tx
        .select({
          modelVersionId: competencyModelVersions.id,
        })
        .from(competencyModelVersions)
        .where(
          and(
            eq(competencyModelVersions.id, input.modelVersionId),
            eq(competencyModelVersions.companyId, input.companyId),
          ),
        )
        .limit(1);

      if (!modelRows[0]) {
        throw createOperationError("not_found", "Model version not found in active company.", {
          modelVersionId: input.modelVersionId,
          companyId: input.companyId,
        });
      }

      const timezone = input.timezone?.trim() || company.timezone;
      const now = new Date();
      const insertedRows = await tx
        .insert(campaigns)
        .values({
          companyId: input.companyId,
          modelVersionId: input.modelVersionId,
          name,
          status: "draft",
          timezone,
          startAt,
          endAt,
          lockedAt: null,
          createdAt: now,
          updatedAt: now,
        })
        .returning({
          campaignId: campaigns.id,
          createdAt: campaigns.createdAt,
        });

      const campaign = insertedRows[0];
      if (!campaign) {
        throw createOperationError("invalid_transition", "Failed to create campaign.");
      }

      return {
        campaignId: campaign.campaignId,
        companyId: input.companyId,
        modelVersionId: input.modelVersionId,
        name,
        status: "draft",
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        timezone,
        createdAt: campaign.createdAt.toISOString(),
      };
    });
  } finally {
    await pool.end();
  }
};

export const startCampaign = async (input: {
  companyId: string;
  campaignId: string;
}): Promise<TransitionCampaignStatusOutput> => {
  return transitionCampaignStatus({
    companyId: input.companyId,
    campaignId: input.campaignId,
    targetStatus: "started",
  });
};

export const stopCampaign = async (input: {
  companyId: string;
  campaignId: string;
}): Promise<TransitionCampaignStatusOutput> => {
  return transitionCampaignStatus({
    companyId: input.companyId,
    campaignId: input.campaignId,
    targetStatus: "ended",
  });
};

export const endCampaign = async (input: {
  companyId: string;
  campaignId: string;
}): Promise<TransitionCampaignStatusOutput> => {
  return transitionCampaignStatus({
    companyId: input.companyId,
    campaignId: input.campaignId,
    targetStatus: "ended",
  });
};

export const setCampaignModelVersion = async (input: {
  companyId: string;
  campaignId: string;
  modelVersionId: string;
}): Promise<CampaignSetModelVersionOutput> => {
  const pool = createPool();
  try {
    const db = createDb(pool);

    return await db.transaction(async (tx) => {
      const campaignRows = await tx
        .select({
          campaignId: campaigns.id,
          companyId: campaigns.companyId,
          status: campaigns.status,
          modelVersionId: campaigns.modelVersionId,
        })
        .from(campaigns)
        .where(and(eq(campaigns.id, input.campaignId), eq(campaigns.companyId, input.companyId)))
        .limit(1);

      const campaign = campaignRows[0];
      if (!campaign) {
        throw createOperationError("not_found", "Campaign not found in active company.", {
          campaignId: input.campaignId,
          companyId: input.companyId,
        });
      }

      if (campaign.status !== "draft") {
        throw createOperationError(
          "campaign_started_immutable",
          "Campaign model version can be changed only in draft status.",
          {
            campaignId: input.campaignId,
            status: campaign.status,
          },
        );
      }

      const modelRows = await tx
        .select({
          modelVersionId: competencyModelVersions.id,
        })
        .from(competencyModelVersions)
        .where(
          and(
            eq(competencyModelVersions.id, input.modelVersionId),
            eq(competencyModelVersions.companyId, input.companyId),
          ),
        )
        .limit(1);

      if (!modelRows[0]) {
        throw createOperationError("not_found", "Model version not found in active company.", {
          modelVersionId: input.modelVersionId,
          companyId: input.companyId,
        });
      }

      const previousModelVersionId = campaign.modelVersionId;
      const now = new Date();
      if (previousModelVersionId === input.modelVersionId) {
        return {
          campaignId: input.campaignId,
          modelVersionId: input.modelVersionId,
          changed: false,
          updatedAt: now.toISOString(),
        };
      }

      const updatedRows = await tx
        .update(campaigns)
        .set({
          modelVersionId: input.modelVersionId,
          updatedAt: now,
        })
        .where(eq(campaigns.id, input.campaignId))
        .returning({
          modelVersionId: campaigns.modelVersionId,
          updatedAt: campaigns.updatedAt,
        });

      const updated = updatedRows[0];
      if (!updated?.modelVersionId) {
        throw createOperationError("invalid_transition", "Failed to set campaign model version.");
      }

      return {
        campaignId: input.campaignId,
        modelVersionId: updated.modelVersionId,
        changed: true,
        updatedAt: updated.updatedAt.toISOString(),
      };
    });
  } finally {
    await pool.end();
  }
};

export const setCampaignWeights = async (input: {
  companyId: string;
  campaignId: string;
  manager: number;
  peers: number;
  subordinates: number;
}): Promise<CampaignWeightsSetOutput> => {
  const manager = input.manager;
  const peers = input.peers;
  const subordinates = input.subordinates;
  const self = 0;

  const weights = [manager, peers, subordinates];
  for (const value of weights) {
    if (!Number.isFinite(value) || value < 0) {
      throw createOperationError("invalid_input", "Weights must be non-negative numbers.");
    }
  }

  const roundedSum = manager + peers + subordinates + self;
  if (Math.abs(roundedSum - 100) > Number.EPSILON) {
    throw createOperationError("invalid_input", "Weights must sum to 100 with self=0.");
  }

  const pool = createPool();
  try {
    const db = createDb(pool);

    return await db.transaction(async (tx) => {
      const campaignRows = await tx
        .select({
          campaignId: campaigns.id,
          status: campaigns.status,
          lockedAt: campaigns.lockedAt,
          managerWeight: campaigns.managerWeight,
          peersWeight: campaigns.peersWeight,
          subordinatesWeight: campaigns.subordinatesWeight,
          selfWeight: campaigns.selfWeight,
        })
        .from(campaigns)
        .where(and(eq(campaigns.id, input.campaignId), eq(campaigns.companyId, input.companyId)))
        .limit(1);

      const campaign = campaignRows[0];
      if (!campaign) {
        throw createOperationError("not_found", "Campaign not found in active company.", {
          campaignId: input.campaignId,
          companyId: input.companyId,
        });
      }

      if (campaign.lockedAt) {
        throw createOperationError("campaign_locked", "Campaign matrix is locked.", {
          campaignId: input.campaignId,
          lockedAt: campaign.lockedAt.toISOString(),
        });
      }

      if (campaign.status !== "draft" && campaign.status !== "started") {
        throw createOperationError(
          "invalid_transition",
          "Campaign weights can be changed only in draft or started status.",
          {
            campaignId: input.campaignId,
            status: campaign.status,
          },
        );
      }

      const changed =
        campaign.managerWeight !== manager ||
        campaign.peersWeight !== peers ||
        campaign.subordinatesWeight !== subordinates ||
        campaign.selfWeight !== self;

      const now = new Date();
      if (!changed) {
        return {
          campaignId: input.campaignId,
          manager,
          peers,
          subordinates,
          self,
          changed: false,
          updatedAt: now.toISOString(),
        };
      }

      const updatedRows = await tx
        .update(campaigns)
        .set({
          managerWeight: manager,
          peersWeight: peers,
          subordinatesWeight: subordinates,
          selfWeight: self,
          updatedAt: now,
        })
        .where(eq(campaigns.id, input.campaignId))
        .returning({
          managerWeight: campaigns.managerWeight,
          peersWeight: campaigns.peersWeight,
          subordinatesWeight: campaigns.subordinatesWeight,
          selfWeight: campaigns.selfWeight,
          updatedAt: campaigns.updatedAt,
        });

      const updated = updatedRows[0];
      if (!updated) {
        throw createOperationError("invalid_transition", "Failed to set campaign weights.");
      }

      return {
        campaignId: input.campaignId,
        manager: updated.managerWeight,
        peers: updated.peersWeight,
        subordinates: updated.subordinatesWeight,
        self: 0,
        changed: true,
        updatedAt: updated.updatedAt.toISOString(),
      };
    });
  } finally {
    await pool.end();
  }
};
