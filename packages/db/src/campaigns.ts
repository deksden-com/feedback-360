import { createOperationError } from "@feedback-360/api-contract";
import { and, desc, eq } from "drizzle-orm";

import { createDb, createPool } from "./db";
import { enqueueCampaignInvitesOnStartInDb } from "./notifications";
import { ensureQuestionnairesForCampaignAssignmentsInDb } from "./questionnaires";
import { campaigns, companies, competencyModelVersions } from "./schema";
import { createCampaignEmployeeSnapshotsForCampaignStartInDb } from "./snapshots";

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

export type CampaignListOutput = {
  items: Array<{
    campaignId: string;
    companyId: string;
    name: string;
    status: CampaignLifecycleStatus;
    modelVersionId: string | null;
    modelName: string | null;
    modelKind: "indicators" | "levels" | null;
    modelVersion: number | null;
    startAt: string;
    endAt: string;
    timezone: string;
    lockedAt?: string;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type CampaignGetOutput = CampaignListOutput["items"][number] & {
  managerWeight: number;
  peersWeight: number;
  subordinatesWeight: number;
  selfWeight: number;
};

export type UpdateCampaignDraftOutput = {
  campaignId: string;
  companyId: string;
  modelVersionId: string;
  name: string;
  status: "draft";
  startAt: string;
  endAt: string;
  timezone: string;
  changed: boolean;
  updatedAt: string;
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

const normalizeModelKind = (value: string | null): "indicators" | "levels" | null => {
  if (value === "indicators" || value === "levels") {
    return value;
  }

  return null;
};

const mapCampaignRow = (row: {
  campaignId: string;
  companyId: string;
  name: string;
  status: string;
  modelVersionId: string | null;
  modelName: string | null;
  modelKind: string | null;
  modelVersion: number | null;
  startAt: Date;
  endAt: Date;
  timezone: string;
  lockedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): CampaignListOutput["items"][number] => {
  return {
    campaignId: row.campaignId,
    companyId: row.companyId,
    name: row.name,
    status: ensureCampaignLifecycleStatus(row.status),
    modelVersionId: row.modelVersionId,
    modelName: row.modelName,
    modelKind: normalizeModelKind(row.modelKind),
    modelVersion: row.modelVersion,
    startAt: row.startAt.toISOString(),
    endAt: row.endAt.toISOString(),
    timezone: row.timezone,
    ...(row.lockedAt ? { lockedAt: row.lockedAt.toISOString() } : {}),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
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
          name: campaigns.name,
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
          await enqueueCampaignInvitesOnStartInDb(tx, {
            companyId: input.companyId,
            campaignId: input.campaignId,
            campaignName: campaign.name,
            now,
          });
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

      if (input.targetStatus === "started") {
        await ensureQuestionnairesForCampaignAssignmentsInDb(tx, {
          companyId: input.companyId,
          campaignId: input.campaignId,
        });
        await createCampaignEmployeeSnapshotsForCampaignStartInDb(tx, {
          companyId: input.companyId,
          campaignId: input.campaignId,
        });
        await enqueueCampaignInvitesOnStartInDb(tx, {
          companyId: input.companyId,
          campaignId: input.campaignId,
          campaignName: campaign.name,
          now,
        });
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

export const listCampaigns = async (input: {
  companyId: string;
  status?: CampaignLifecycleStatus;
}): Promise<CampaignListOutput> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    const rows = await db
      .select({
        campaignId: campaigns.id,
        companyId: campaigns.companyId,
        name: campaigns.name,
        status: campaigns.status,
        modelVersionId: campaigns.modelVersionId,
        modelName: competencyModelVersions.name,
        modelKind: competencyModelVersions.kind,
        modelVersion: competencyModelVersions.version,
        startAt: campaigns.startAt,
        endAt: campaigns.endAt,
        timezone: campaigns.timezone,
        lockedAt: campaigns.lockedAt,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
      })
      .from(campaigns)
      .leftJoin(competencyModelVersions, eq(competencyModelVersions.id, campaigns.modelVersionId))
      .where(
        and(
          eq(campaigns.companyId, input.companyId),
          input.status ? eq(campaigns.status, input.status) : undefined,
        ),
      )
      .orderBy(desc(campaigns.updatedAt), desc(campaigns.createdAt));

    return {
      items: rows.map(mapCampaignRow),
    };
  } finally {
    await pool.end();
  }
};

export const getCampaign = async (input: {
  companyId: string;
  campaignId: string;
}): Promise<CampaignGetOutput> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    const rows = await db
      .select({
        campaignId: campaigns.id,
        companyId: campaigns.companyId,
        name: campaigns.name,
        status: campaigns.status,
        modelVersionId: campaigns.modelVersionId,
        modelName: competencyModelVersions.name,
        modelKind: competencyModelVersions.kind,
        modelVersion: competencyModelVersions.version,
        startAt: campaigns.startAt,
        endAt: campaigns.endAt,
        timezone: campaigns.timezone,
        lockedAt: campaigns.lockedAt,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
        managerWeight: campaigns.managerWeight,
        peersWeight: campaigns.peersWeight,
        subordinatesWeight: campaigns.subordinatesWeight,
        selfWeight: campaigns.selfWeight,
      })
      .from(campaigns)
      .leftJoin(competencyModelVersions, eq(competencyModelVersions.id, campaigns.modelVersionId))
      .where(and(eq(campaigns.companyId, input.companyId), eq(campaigns.id, input.campaignId)))
      .limit(1);

    const row = rows[0];
    if (!row) {
      throw createOperationError("not_found", "Campaign not found in active company.", {
        companyId: input.companyId,
        campaignId: input.campaignId,
      });
    }

    return {
      ...mapCampaignRow(row),
      managerWeight: row.managerWeight,
      peersWeight: row.peersWeight,
      subordinatesWeight: row.subordinatesWeight,
      selfWeight: row.selfWeight,
    };
  } finally {
    await pool.end();
  }
};

export const updateCampaignDraft = async (input: {
  companyId: string;
  campaignId: string;
  name: string;
  modelVersionId: string;
  startAt: string;
  endAt: string;
  timezone?: string;
}): Promise<UpdateCampaignDraftOutput> => {
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
      const campaignRows = await tx
        .select({
          campaignId: campaigns.id,
          companyId: campaigns.companyId,
          status: campaigns.status,
          name: campaigns.name,
          modelVersionId: campaigns.modelVersionId,
          startAt: campaigns.startAt,
          endAt: campaigns.endAt,
          timezone: campaigns.timezone,
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
          "Campaign draft settings can be changed only in draft status.",
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

      const resolvedTimezone = input.timezone?.trim() || campaign.timezone;
      const changed =
        campaign.name !== name ||
        campaign.modelVersionId !== input.modelVersionId ||
        campaign.startAt.getTime() !== startAt.getTime() ||
        campaign.endAt.getTime() !== endAt.getTime() ||
        campaign.timezone !== resolvedTimezone;

      const now = new Date();
      if (!changed) {
        return {
          campaignId: campaign.campaignId,
          companyId: campaign.companyId,
          modelVersionId: input.modelVersionId,
          name,
          status: "draft",
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          timezone: resolvedTimezone,
          changed: false,
          updatedAt: now.toISOString(),
        };
      }

      const updatedRows = await tx
        .update(campaigns)
        .set({
          name,
          modelVersionId: input.modelVersionId,
          startAt,
          endAt,
          timezone: resolvedTimezone,
          updatedAt: now,
        })
        .where(eq(campaigns.id, input.campaignId))
        .returning({
          campaignId: campaigns.id,
          companyId: campaigns.companyId,
          modelVersionId: campaigns.modelVersionId,
          name: campaigns.name,
          status: campaigns.status,
          startAt: campaigns.startAt,
          endAt: campaigns.endAt,
          timezone: campaigns.timezone,
          updatedAt: campaigns.updatedAt,
        });

      const updated = updatedRows[0];
      if (!updated?.modelVersionId) {
        throw createOperationError("invalid_transition", "Failed to update campaign draft.");
      }

      return {
        campaignId: updated.campaignId,
        companyId: updated.companyId,
        modelVersionId: updated.modelVersionId,
        name: updated.name,
        status: "draft",
        startAt: updated.startAt.toISOString(),
        endAt: updated.endAt.toISOString(),
        timezone: updated.timezone,
        changed: true,
        updatedAt: updated.updatedAt.toISOString(),
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
