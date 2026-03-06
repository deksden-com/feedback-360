import type {
  ClientSetActiveCompanyOutput,
  OperationContext,
  OperationResult,
  SeedRunInput,
  SeedRunOutput,
  SystemPingOutput,
} from "@feedback-360/api-contract";

import { type AiClientMethods, createAiClientMethods } from "./features/ai";
import { type CampaignsClientMethods, createCampaignsClientMethods } from "./features/campaigns";
import {
  type IdentityTenancyClientMethods,
  createIdentityTenancyClientMethods,
} from "./features/identity-tenancy";
import { type MatrixClientMethods, createMatrixClientMethods } from "./features/matrix";
import { type ModelsClientMethods, createModelsClientMethods } from "./features/models";
import {
  type NotificationsClientMethods,
  createNotificationsClientMethods,
} from "./features/notifications";
import { type OpsClientMethods, createOpsClientMethods } from "./features/ops";
import { type OrgClientMethods, createOrgClientMethods } from "./features/org";
import {
  type QuestionnairesClientMethods,
  createQuestionnairesClientMethods,
} from "./features/questionnaires";
import { type ResultsClientMethods, createResultsClientMethods } from "./features/results";
import { type SystemClientMethods, createSystemClientMethods } from "./features/system";
import {
  type CreateHttpTransportOptions,
  type OperationTransport,
  createClientRuntime,
  createHttpTransport,
  createInprocTransport,
} from "./shared/runtime";

type BaseClientMethods = {
  seedRun(input: SeedRunInput): Promise<SeedRunOutput>;
  systemPing(context?: OperationContext): Promise<OperationResult<SystemPingOutput>>;
  invokeOperation: ReturnType<typeof createClientRuntime>["invokeOperation"];
  setActiveContext(context: OperationContext): OperationResult<OperationContext>;
  getActiveContext(): OperationContext;
  setActiveCompany(companyId: string): OperationResult<ClientSetActiveCompanyOutput>;
  getActiveCompany(): string | undefined;
};

export type Feedback360Client = BaseClientMethods &
  IdentityTenancyClientMethods &
  ModelsClientMethods &
  CampaignsClientMethods &
  OrgClientMethods &
  NotificationsClientMethods &
  OpsClientMethods &
  MatrixClientMethods &
  AiClientMethods &
  QuestionnairesClientMethods &
  ResultsClientMethods;

export { createHttpTransport, createInprocTransport };
export type { CreateHttpTransportOptions, OperationTransport };

export const createClient = (transport: OperationTransport): Feedback360Client => {
  const runtime = createClientRuntime(transport);

  return {
    invokeOperation: runtime.invokeOperation,
    ...createSystemClientMethods(runtime),
    ...createIdentityTenancyClientMethods(runtime),
    ...createModelsClientMethods(runtime),
    ...createCampaignsClientMethods(runtime),
    ...createOrgClientMethods(runtime),
    ...createNotificationsClientMethods(runtime),
    ...createOpsClientMethods(runtime),
    ...createMatrixClientMethods(runtime),
    ...createAiClientMethods(runtime),
    ...createQuestionnairesClientMethods(runtime),
    ...createResultsClientMethods(runtime),
  };
};

export const createInprocClient = (): Feedback360Client => {
  return createClient(createInprocTransport());
};

export const clientReady = true;
