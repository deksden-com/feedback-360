import {
  type SeedRunInput,
  type SeedRunOutput,
  parseSeedRunInput,
  parseSeedRunOutput,
} from "@feedback-360/api-contract";
import { eq, sql } from "drizzle-orm";

import { createDb, createPool } from "./db";
import {
  campaignAssignments,
  campaigns,
  companies,
  companyMemberships,
  competencies,
  competencyGroups,
  competencyIndicators,
  competencyLevels,
  competencyModelVersions,
  departments,
  employeeDepartmentHistory,
  employeeManagerHistory,
  employeePositions,
  employeeUserLinks,
  employees,
  questionnaires,
} from "./schema";
import { createCampaignEmployeeSnapshotsForCampaignStartInDb } from "./snapshots";

const seededAt = new Date("2026-01-01T09:00:00.000Z");

const ids = {
  companyMain: "10000000-0000-4000-8000-000000000001",
  companyA: "10000000-0000-4000-8000-000000000010",
  companyB: "10000000-0000-4000-8000-000000000011",
  membershipHrAdmin: "11000000-0000-4000-8000-000000000001",
  membershipHrReader: "11000000-0000-4000-8000-000000000008",
  membershipSharedCompanyA: "11000000-0000-4000-8000-000000000010",
  membershipSharedCompanyB: "11000000-0000-4000-8000-000000000011",
  membershipCompanyAOnly: "11000000-0000-4000-8000-000000000012",
  membershipCeo: "11000000-0000-4000-8000-000000000002",
  membershipHeadA: "11000000-0000-4000-8000-000000000003",
  membershipHeadB: "11000000-0000-4000-8000-000000000004",
  membershipStaffA1: "11000000-0000-4000-8000-000000000005",
  membershipStaffA2: "11000000-0000-4000-8000-000000000006",
  membershipStaffB1: "11000000-0000-4000-8000-000000000007",
  employeeHrAdmin: "12000000-0000-4000-8000-000000000001",
  employeeHrReader: "12000000-0000-4000-8000-000000000008",
  employeeSharedCompanyA: "12000000-0000-4000-8000-000000000010",
  employeeSharedCompanyB: "12000000-0000-4000-8000-000000000011",
  employeeCompanyAOnly: "12000000-0000-4000-8000-000000000012",
  employeeCeo: "12000000-0000-4000-8000-000000000002",
  employeeHeadA: "12000000-0000-4000-8000-000000000003",
  employeeHeadB: "12000000-0000-4000-8000-000000000004",
  employeeStaffA1: "12000000-0000-4000-8000-000000000005",
  employeeStaffA2: "12000000-0000-4000-8000-000000000006",
  employeeStaffB1: "12000000-0000-4000-8000-000000000007",
  employeeLinkHrAdmin: "13000000-0000-4000-8000-000000000001",
  employeeLinkHrReader: "13000000-0000-4000-8000-000000000008",
  employeeLinkSharedCompanyA: "13000000-0000-4000-8000-000000000010",
  employeeLinkSharedCompanyB: "13000000-0000-4000-8000-000000000011",
  employeeLinkCompanyAOnly: "13000000-0000-4000-8000-000000000012",
  employeeLinkCeo: "13000000-0000-4000-8000-000000000002",
  employeeLinkHeadA: "13000000-0000-4000-8000-000000000003",
  employeeLinkHeadB: "13000000-0000-4000-8000-000000000004",
  employeeLinkStaffA1: "13000000-0000-4000-8000-000000000005",
  employeeLinkStaffA2: "13000000-0000-4000-8000-000000000006",
  employeeLinkStaffB1: "13000000-0000-4000-8000-000000000007",
  departmentRoot: "14000000-0000-4000-8000-000000000001",
  departmentA: "14000000-0000-4000-8000-000000000002",
  departmentB: "14000000-0000-4000-8000-000000000003",
  departmentHistoryHrAdmin: "15000000-0000-4000-8000-000000000001",
  departmentHistoryCeo: "15000000-0000-4000-8000-000000000002",
  departmentHistoryHeadA: "15000000-0000-4000-8000-000000000003",
  departmentHistoryHeadB: "15000000-0000-4000-8000-000000000004",
  departmentHistoryStaffA1: "15000000-0000-4000-8000-000000000005",
  departmentHistoryStaffA2: "15000000-0000-4000-8000-000000000006",
  departmentHistoryStaffB1: "15000000-0000-4000-8000-000000000007",
  managerHistoryHeadA: "16000000-0000-4000-8000-000000000001",
  managerHistoryHeadB: "16000000-0000-4000-8000-000000000002",
  managerHistoryStaffA1: "16000000-0000-4000-8000-000000000003",
  managerHistoryStaffA2: "16000000-0000-4000-8000-000000000004",
  managerHistoryStaffB1: "16000000-0000-4000-8000-000000000005",
  positionHrAdmin: "17000000-0000-4000-8000-000000000001",
  positionHrReader: "17000000-0000-4000-8000-000000000008",
  positionCeo: "17000000-0000-4000-8000-000000000002",
  positionHeadA: "17000000-0000-4000-8000-000000000003",
  positionHeadB: "17000000-0000-4000-8000-000000000004",
  positionStaffA1: "17000000-0000-4000-8000-000000000005",
  positionStaffA2: "17000000-0000-4000-8000-000000000006",
  positionStaffB1: "17000000-0000-4000-8000-000000000007",
  userHrAdmin: "18000000-0000-4000-8000-000000000001",
  userHrReader: "18000000-0000-4000-8000-000000000008",
  userShared: "18000000-0000-4000-8000-000000000010",
  userCompanyAOnly: "18000000-0000-4000-8000-000000000012",
  userCeo: "18000000-0000-4000-8000-000000000002",
  userHeadA: "18000000-0000-4000-8000-000000000003",
  userHeadB: "18000000-0000-4000-8000-000000000004",
  userStaffA1: "18000000-0000-4000-8000-000000000005",
  userStaffA2: "18000000-0000-4000-8000-000000000006",
  userStaffB1: "18000000-0000-4000-8000-000000000007",
  campaignMain: "19000000-0000-4000-8000-000000000001",
  campaignA: "19000000-0000-4000-8000-000000000010",
  campaignB: "19000000-0000-4000-8000-000000000011",
  questionnaireMain: "20000000-0000-4000-8000-000000000001",
  questionnaireMainInProgress: "20000000-0000-4000-8000-000000000002",
  questionnaireMainSubmitted: "20000000-0000-4000-8000-000000000003",
  questionnaireCompanyA: "20000000-0000-4000-8000-000000000010",
  questionnaireCompanyB: "20000000-0000-4000-8000-000000000011",
  modelVersionMainIndicators: "21000000-0000-4000-8000-000000000001",
  modelVersionMainLevels: "21000000-0000-4000-8000-000000000002",
  competencyGroupMain: "22000000-0000-4000-8000-000000000001",
  competencyMain: "23000000-0000-4000-8000-000000000001",
  competencySecondary: "23000000-0000-4000-8000-000000000002",
  competencyIndicatorMain1: "24000000-0000-4000-8000-000000000001",
  competencyIndicatorMain2: "24000000-0000-4000-8000-000000000002",
  competencyIndicatorMain3: "24000000-0000-4000-8000-000000000003",
  competencyIndicatorSecondary1: "24000000-0000-4000-8000-000000000004",
  competencyLevelMain1: "26000000-0000-4000-8000-000000000001",
  competencyLevelMain2: "26000000-0000-4000-8000-000000000002",
  competencyLevelMain3: "26000000-0000-4000-8000-000000000003",
  competencyLevelMain4: "26000000-0000-4000-8000-000000000004",
  campaignAssignmentSubjectManager: "25000000-0000-4000-8000-000000000001",
  campaignAssignmentSubjectPeer1: "25000000-0000-4000-8000-000000000002",
  campaignAssignmentSubjectPeer2: "25000000-0000-4000-8000-000000000003",
  campaignAssignmentSubjectSubordinate1: "25000000-0000-4000-8000-000000000004",
  campaignAssignmentSubjectPeer3: "25000000-0000-4000-8000-000000000005",
  questionnaireMainSubordinate: "20000000-0000-4000-8000-000000000004",
  questionnaireMainPeer3: "20000000-0000-4000-8000-000000000005",
} as const;

const truncateSql = sql.raw(`
  truncate table
    notification_attempts,
    notification_outbox,
    ai_webhook_receipts,
    ai_jobs,
    competency_levels,
    competency_indicators,
    competencies,
    competency_groups,
    competency_model_versions,
    campaign_assignments,
    campaign_participants,
    campaign_employee_snapshots,
    questionnaires,
    campaigns,
    employee_positions,
    employee_manager_history,
    employee_department_history,
    employee_user_links,
    company_memberships,
    departments,
    employees,
    companies
  restart identity cascade
`);

const seedAdvisoryLockSql = sql.raw("select pg_advisory_lock(360360360)");
const seedAdvisoryUnlockSql = sql.raw("select pg_advisory_unlock(360360360)");

const resetDatabase = async (db: ReturnType<typeof createDb>): Promise<void> => {
  await db.execute(truncateSql);
};

const buildS1Handles = (): Record<string, string> => {
  return {
    "company.main": ids.companyMain,
    "employee.hr_admin": ids.employeeHrAdmin,
    "employee.hr_reader": ids.employeeHrReader,
    "membership.hr_admin@company.main": ids.membershipHrAdmin,
    "membership.hr_reader@company.main": ids.membershipHrReader,
    "user.hr_admin": ids.userHrAdmin,
    "user.hr_reader": ids.userHrReader,
  };
};

const buildS1MultiTenantHandles = (): Record<string, string> => {
  return {
    "company.a": ids.companyA,
    "company.b": ids.companyB,
    "user.shared": ids.userShared,
    "user.company_a_only": ids.userCompanyAOnly,
    "employee.shared@company.a": ids.employeeSharedCompanyA,
    "employee.shared@company.b": ids.employeeSharedCompanyB,
    "employee.company_a_only@company.a": ids.employeeCompanyAOnly,
    "membership.shared@company.a": ids.membershipSharedCompanyA,
    "membership.shared@company.b": ids.membershipSharedCompanyB,
    "membership.company_a_only@company.a": ids.membershipCompanyAOnly,
    "campaign.a": ids.campaignA,
    "campaign.b": ids.campaignB,
    "questionnaire.a": ids.questionnaireCompanyA,
    "questionnaire.b": ids.questionnaireCompanyB,
  };
};

const insertS1 = async (db: ReturnType<typeof createDb>): Promise<Record<string, string>> => {
  await db.insert(companies).values({
    id: ids.companyMain,
    name: "Acme 360",
    timezone: "Europe/Kaliningrad",
    createdAt: seededAt,
    updatedAt: seededAt,
  });

  await db.insert(employees).values([
    {
      id: ids.employeeHrAdmin,
      companyId: ids.companyMain,
      email: "hr.admin@acme.example",
      firstName: "HR",
      lastName: "Admin",
      phone: "+10000000001",
      isActive: true,
      createdAt: seededAt,
      updatedAt: seededAt,
    },
    {
      id: ids.employeeHrReader,
      companyId: ids.companyMain,
      email: "hr.reader@acme.example",
      firstName: "HR",
      lastName: "Reader",
      phone: "+10000000008",
      isActive: true,
      createdAt: seededAt,
      updatedAt: seededAt,
    },
  ]);

  await db.insert(companyMemberships).values([
    {
      id: ids.membershipHrAdmin,
      companyId: ids.companyMain,
      userId: ids.userHrAdmin,
      role: "hr_admin",
      createdAt: seededAt,
    },
    {
      id: ids.membershipHrReader,
      companyId: ids.companyMain,
      userId: ids.userHrReader,
      role: "hr_reader",
      createdAt: seededAt,
    },
  ]);

  await db.insert(employeeUserLinks).values([
    {
      id: ids.employeeLinkHrAdmin,
      companyId: ids.companyMain,
      employeeId: ids.employeeHrAdmin,
      userId: ids.userHrAdmin,
      createdAt: seededAt,
    },
    {
      id: ids.employeeLinkHrReader,
      companyId: ids.companyMain,
      employeeId: ids.employeeHrReader,
      userId: ids.userHrReader,
      createdAt: seededAt,
    },
  ]);

  await db.insert(employeePositions).values([
    {
      id: ids.positionHrAdmin,
      employeeId: ids.employeeHrAdmin,
      title: "HR Admin",
      level: 8,
      startAt: seededAt,
      createdAt: seededAt,
    },
    {
      id: ids.positionHrReader,
      employeeId: ids.employeeHrReader,
      title: "HR Reader",
      level: 7,
      startAt: seededAt,
      createdAt: seededAt,
    },
  ]);

  return buildS1Handles();
};

const insertS1MultiTenant = async (
  db: ReturnType<typeof createDb>,
): Promise<Record<string, string>> => {
  const campaignStartAt = new Date("2026-01-10T09:00:00.000Z");
  const campaignEndAt = new Date("2026-01-20T18:00:00.000Z");

  await db.insert(companies).values([
    {
      id: ids.companyA,
      name: "Acme 360 A",
      timezone: "Europe/Kaliningrad",
      createdAt: seededAt,
      updatedAt: seededAt,
    },
    {
      id: ids.companyB,
      name: "Acme 360 B",
      timezone: "Europe/Kaliningrad",
      createdAt: seededAt,
      updatedAt: seededAt,
    },
  ]);

  await db.insert(employees).values([
    {
      id: ids.employeeSharedCompanyA,
      companyId: ids.companyA,
      email: "shared.user@acme.example",
      firstName: "Shared",
      lastName: "User",
      phone: "+10000000910",
      isActive: true,
      createdAt: seededAt,
      updatedAt: seededAt,
    },
    {
      id: ids.employeeSharedCompanyB,
      companyId: ids.companyB,
      email: "shared.user@acme.example",
      firstName: "Shared",
      lastName: "User",
      phone: "+10000000911",
      isActive: true,
      createdAt: seededAt,
      updatedAt: seededAt,
    },
    {
      id: ids.employeeCompanyAOnly,
      companyId: ids.companyA,
      email: "company.a.only@acme.example",
      firstName: "CompanyA",
      lastName: "Only",
      phone: "+10000000912",
      isActive: true,
      createdAt: seededAt,
      updatedAt: seededAt,
    },
  ]);

  await db.insert(companyMemberships).values([
    {
      id: ids.membershipSharedCompanyA,
      companyId: ids.companyA,
      userId: ids.userShared,
      role: "hr_admin",
      createdAt: seededAt,
    },
    {
      id: ids.membershipSharedCompanyB,
      companyId: ids.companyB,
      userId: ids.userShared,
      role: "hr_admin",
      createdAt: seededAt,
    },
    {
      id: ids.membershipCompanyAOnly,
      companyId: ids.companyA,
      userId: ids.userCompanyAOnly,
      role: "employee",
      createdAt: seededAt,
    },
  ]);

  await db.insert(employeeUserLinks).values([
    {
      id: ids.employeeLinkSharedCompanyA,
      companyId: ids.companyA,
      employeeId: ids.employeeSharedCompanyA,
      userId: ids.userShared,
      createdAt: seededAt,
    },
    {
      id: ids.employeeLinkSharedCompanyB,
      companyId: ids.companyB,
      employeeId: ids.employeeSharedCompanyB,
      userId: ids.userShared,
      createdAt: seededAt,
    },
    {
      id: ids.employeeLinkCompanyAOnly,
      companyId: ids.companyA,
      employeeId: ids.employeeCompanyAOnly,
      userId: ids.userCompanyAOnly,
      createdAt: seededAt,
    },
  ]);

  await db.insert(campaigns).values([
    {
      id: ids.campaignA,
      companyId: ids.companyA,
      name: "MT Campaign A",
      status: "started",
      timezone: "Europe/Kaliningrad",
      startAt: campaignStartAt,
      endAt: campaignEndAt,
      lockedAt: null,
      createdAt: seededAt,
      updatedAt: seededAt,
    },
    {
      id: ids.campaignB,
      companyId: ids.companyB,
      name: "MT Campaign B",
      status: "started",
      timezone: "Europe/Kaliningrad",
      startAt: campaignStartAt,
      endAt: campaignEndAt,
      lockedAt: null,
      createdAt: seededAt,
      updatedAt: seededAt,
    },
  ]);

  await db.insert(questionnaires).values([
    {
      id: ids.questionnaireCompanyA,
      companyId: ids.companyA,
      campaignId: ids.campaignA,
      subjectEmployeeId: ids.employeeSharedCompanyA,
      raterEmployeeId: ids.employeeSharedCompanyA,
      status: "not_started",
      draftPayload: {},
      submittedAt: null,
      createdAt: seededAt,
      updatedAt: seededAt,
    },
    {
      id: ids.questionnaireCompanyB,
      companyId: ids.companyB,
      campaignId: ids.campaignB,
      subjectEmployeeId: ids.employeeSharedCompanyB,
      raterEmployeeId: ids.employeeSharedCompanyB,
      status: "not_started",
      draftPayload: {},
      submittedAt: null,
      createdAt: seededAt,
      updatedAt: seededAt,
    },
  ]);

  return buildS1MultiTenantHandles();
};

const buildS2Handles = (): Record<string, string> => {
  return {
    ...buildS1Handles(),
    "department.root": ids.departmentRoot,
    "department.a": ids.departmentA,
    "department.b": ids.departmentB,
    "employee.ceo": ids.employeeCeo,
    "employee.head_a": ids.employeeHeadA,
    "employee.head_b": ids.employeeHeadB,
    "employee.staff_a1": ids.employeeStaffA1,
    "employee.staff_a2": ids.employeeStaffA2,
    "employee.staff_b1": ids.employeeStaffB1,
    "user.ceo": ids.userCeo,
    "user.head_a": ids.userHeadA,
    "user.head_b": ids.userHeadB,
    "user.staff_a1": ids.userStaffA1,
    "user.staff_a2": ids.userStaffA2,
    "user.staff_b1": ids.userStaffB1,
  };
};

const buildS5Handles = (): Record<string, string> => {
  return {
    ...buildS2Handles(),
    "model.version.main": ids.modelVersionMainIndicators,
    "competency.main": ids.competencyMain,
    "competency.secondary": ids.competencySecondary,
    "indicator.main_1": ids.competencyIndicatorMain1,
    "indicator.main_2": ids.competencyIndicatorMain2,
    "indicator.main_3": ids.competencyIndicatorMain3,
    "indicator.secondary_1": ids.competencyIndicatorSecondary1,
    "campaign.main": ids.campaignMain,
    "questionnaire.main": ids.questionnaireMain,
  };
};

const buildS6Handles = (): Record<string, string> => {
  return {
    ...buildS5Handles(),
    "questionnaire.main_in_progress": ids.questionnaireMain,
  };
};

const buildS7Handles = (): Record<string, string> => {
  return {
    ...buildS5Handles(),
    "questionnaire.main_not_started": ids.questionnaireMain,
    "questionnaire.main_in_progress": ids.questionnaireMainInProgress,
    "questionnaire.main_submitted": ids.questionnaireMainSubmitted,
  };
};

const buildS7NaHeavyPeerHandles = (): Record<string, string> => {
  return {
    ...buildS7Handles(),
    "employee.subject_main": ids.employeeStaffA1,
    "employee.rater_manager": ids.employeeHeadA,
    "employee.rater_peer_1": ids.employeeStaffA2,
    "employee.rater_peer_2": ids.employeeStaffB1,
    "model.version.main": ids.modelVersionMainIndicators,
    "competency.main": ids.competencyMain,
    "indicator.main_1": ids.competencyIndicatorMain1,
    "indicator.main_2": ids.competencyIndicatorMain2,
    "indicator.main_3": ids.competencyIndicatorMain3,
    "questionnaire.subject_manager": ids.questionnaireMain,
    "questionnaire.subject_peer_1": ids.questionnaireMainInProgress,
    "questionnaire.subject_peer_2": ids.questionnaireMainSubmitted,
  };
};

const buildS7Peers2Handles = (): Record<string, string> => {
  return {
    ...buildS7Handles(),
    "employee.subject_main": ids.employeeStaffA1,
    "employee.rater_manager": ids.employeeHeadA,
    "employee.rater_peer_1": ids.employeeStaffA2,
    "employee.rater_peer_2": ids.employeeStaffB1,
    "employee.rater_subordinate_1": ids.employeeCeo,
    "model.version.main": ids.modelVersionMainIndicators,
    "competency.main": ids.competencyMain,
    "competency.secondary": ids.competencySecondary,
    "indicator.main_1": ids.competencyIndicatorMain1,
    "indicator.secondary_1": ids.competencyIndicatorSecondary1,
    "questionnaire.subject_manager": ids.questionnaireMain,
    "questionnaire.subject_peer_1": ids.questionnaireMainInProgress,
    "questionnaire.subject_peer_2": ids.questionnaireMainSubmitted,
    "questionnaire.subject_subordinate_1": ids.questionnaireMainSubordinate,
  };
};

const buildS7NoSubordinatesHandles = (): Record<string, string> => {
  return {
    ...buildS7Handles(),
    "employee.subject_main": ids.employeeStaffA1,
    "employee.rater_manager": ids.employeeHeadA,
    "employee.rater_peer_1": ids.employeeStaffA2,
    "employee.rater_peer_2": ids.employeeStaffB1,
    "employee.rater_peer_3": ids.employeeCeo,
    "model.version.main": ids.modelVersionMainIndicators,
    "competency.main": ids.competencyMain,
    "indicator.main_1": ids.competencyIndicatorMain1,
    "questionnaire.subject_manager": ids.questionnaireMain,
    "questionnaire.subject_peer_1": ids.questionnaireMainInProgress,
    "questionnaire.subject_peer_2": ids.questionnaireMainSubmitted,
    "questionnaire.subject_peer_3": ids.questionnaireMainPeer3,
  };
};

const buildS7LevelsTieHandles = (): Record<string, string> => {
  return {
    ...buildS7Handles(),
    "employee.subject_main": ids.employeeStaffA1,
    "employee.rater_manager": ids.employeeHeadA,
    "employee.rater_peer_1": ids.employeeStaffA2,
    "employee.rater_peer_2": ids.employeeStaffB1,
    "employee.rater_subordinate_1": ids.employeeCeo,
    "employee.rater_subordinate_2": ids.employeeHeadB,
    "model.version.main": ids.modelVersionMainLevels,
    "competency.main": ids.competencyMain,
    "questionnaire.subject_manager": ids.questionnaireMain,
    "questionnaire.subject_peer_1": ids.questionnaireMainInProgress,
    "questionnaire.subject_peer_2": ids.questionnaireMainSubmitted,
    "questionnaire.subject_subordinate_1": ids.questionnaireMainSubordinate,
    "questionnaire.subject_subordinate_2": ids.questionnaireMainPeer3,
  };
};

const buildS8Handles = (): Record<string, string> => {
  return buildS6Handles();
};

const buildS9Handles = (): Record<string, string> => {
  return {
    ...buildS7Peers2Handles(),
  };
};

const buildS4Handles = (): Record<string, string> => {
  return {
    ...buildS2Handles(),
    "model.version.main": ids.modelVersionMainIndicators,
    "campaign.main": ids.campaignMain,
  };
};

const insertS2 = async (db: ReturnType<typeof createDb>): Promise<Record<string, string>> => {
  await insertS1(db);

  await db.insert(departments).values([
    {
      id: ids.departmentRoot,
      companyId: ids.companyMain,
      parentId: null,
      name: "Headquarters",
      isActive: true,
      createdAt: seededAt,
      updatedAt: seededAt,
    },
    {
      id: ids.departmentA,
      companyId: ids.companyMain,
      parentId: ids.departmentRoot,
      name: "Dept A",
      isActive: true,
      createdAt: seededAt,
      updatedAt: seededAt,
    },
    {
      id: ids.departmentB,
      companyId: ids.companyMain,
      parentId: ids.departmentRoot,
      name: "Dept B",
      isActive: true,
      createdAt: seededAt,
      updatedAt: seededAt,
    },
  ]);

  await db.insert(employees).values([
    {
      id: ids.employeeCeo,
      companyId: ids.companyMain,
      email: "ceo@acme.example",
      firstName: "Ivan",
      lastName: "CEO",
      phone: "+10000000002",
      isActive: true,
      createdAt: seededAt,
      updatedAt: seededAt,
    },
    {
      id: ids.employeeHeadA,
      companyId: ids.companyMain,
      email: "head.a@acme.example",
      firstName: "Anna",
      lastName: "HeadA",
      phone: "+10000000003",
      isActive: true,
      createdAt: seededAt,
      updatedAt: seededAt,
    },
    {
      id: ids.employeeHeadB,
      companyId: ids.companyMain,
      email: "head.b@acme.example",
      firstName: "Boris",
      lastName: "HeadB",
      phone: "+10000000004",
      isActive: true,
      createdAt: seededAt,
      updatedAt: seededAt,
    },
    {
      id: ids.employeeStaffA1,
      companyId: ids.companyMain,
      email: "staff.a1@acme.example",
      firstName: "Sasha",
      lastName: "StaffA1",
      phone: "+10000000005",
      isActive: true,
      createdAt: seededAt,
      updatedAt: seededAt,
    },
    {
      id: ids.employeeStaffA2,
      companyId: ids.companyMain,
      email: "staff.a2@acme.example",
      firstName: "Olga",
      lastName: "StaffA2",
      phone: "+10000000006",
      isActive: true,
      createdAt: seededAt,
      updatedAt: seededAt,
    },
    {
      id: ids.employeeStaffB1,
      companyId: ids.companyMain,
      email: "staff.b1@acme.example",
      firstName: "Petr",
      lastName: "StaffB1",
      phone: "+10000000007",
      isActive: true,
      createdAt: seededAt,
      updatedAt: seededAt,
    },
  ]);

  await db.insert(companyMemberships).values([
    {
      id: ids.membershipCeo,
      companyId: ids.companyMain,
      userId: ids.userCeo,
      role: "manager",
      createdAt: seededAt,
    },
    {
      id: ids.membershipHeadA,
      companyId: ids.companyMain,
      userId: ids.userHeadA,
      role: "manager",
      createdAt: seededAt,
    },
    {
      id: ids.membershipHeadB,
      companyId: ids.companyMain,
      userId: ids.userHeadB,
      role: "manager",
      createdAt: seededAt,
    },
    {
      id: ids.membershipStaffA1,
      companyId: ids.companyMain,
      userId: ids.userStaffA1,
      role: "employee",
      createdAt: seededAt,
    },
    {
      id: ids.membershipStaffA2,
      companyId: ids.companyMain,
      userId: ids.userStaffA2,
      role: "employee",
      createdAt: seededAt,
    },
    {
      id: ids.membershipStaffB1,
      companyId: ids.companyMain,
      userId: ids.userStaffB1,
      role: "employee",
      createdAt: seededAt,
    },
  ]);

  await db.insert(employeeUserLinks).values([
    {
      id: ids.employeeLinkCeo,
      companyId: ids.companyMain,
      employeeId: ids.employeeCeo,
      userId: ids.userCeo,
      createdAt: seededAt,
    },
    {
      id: ids.employeeLinkHeadA,
      companyId: ids.companyMain,
      employeeId: ids.employeeHeadA,
      userId: ids.userHeadA,
      createdAt: seededAt,
    },
    {
      id: ids.employeeLinkHeadB,
      companyId: ids.companyMain,
      employeeId: ids.employeeHeadB,
      userId: ids.userHeadB,
      createdAt: seededAt,
    },
    {
      id: ids.employeeLinkStaffA1,
      companyId: ids.companyMain,
      employeeId: ids.employeeStaffA1,
      userId: ids.userStaffA1,
      createdAt: seededAt,
    },
    {
      id: ids.employeeLinkStaffA2,
      companyId: ids.companyMain,
      employeeId: ids.employeeStaffA2,
      userId: ids.userStaffA2,
      createdAt: seededAt,
    },
    {
      id: ids.employeeLinkStaffB1,
      companyId: ids.companyMain,
      employeeId: ids.employeeStaffB1,
      userId: ids.userStaffB1,
      createdAt: seededAt,
    },
  ]);

  await db.insert(employeeDepartmentHistory).values([
    {
      id: ids.departmentHistoryHrAdmin,
      employeeId: ids.employeeHrAdmin,
      departmentId: ids.departmentRoot,
      startAt: seededAt,
      endAt: null,
      createdAt: seededAt,
    },
    {
      id: ids.departmentHistoryCeo,
      employeeId: ids.employeeCeo,
      departmentId: ids.departmentRoot,
      startAt: seededAt,
      endAt: null,
      createdAt: seededAt,
    },
    {
      id: ids.departmentHistoryHeadA,
      employeeId: ids.employeeHeadA,
      departmentId: ids.departmentA,
      startAt: seededAt,
      endAt: null,
      createdAt: seededAt,
    },
    {
      id: ids.departmentHistoryHeadB,
      employeeId: ids.employeeHeadB,
      departmentId: ids.departmentB,
      startAt: seededAt,
      endAt: null,
      createdAt: seededAt,
    },
    {
      id: ids.departmentHistoryStaffA1,
      employeeId: ids.employeeStaffA1,
      departmentId: ids.departmentA,
      startAt: seededAt,
      endAt: null,
      createdAt: seededAt,
    },
    {
      id: ids.departmentHistoryStaffA2,
      employeeId: ids.employeeStaffA2,
      departmentId: ids.departmentA,
      startAt: seededAt,
      endAt: null,
      createdAt: seededAt,
    },
    {
      id: ids.departmentHistoryStaffB1,
      employeeId: ids.employeeStaffB1,
      departmentId: ids.departmentB,
      startAt: seededAt,
      endAt: null,
      createdAt: seededAt,
    },
  ]);

  await db.insert(employeeManagerHistory).values([
    {
      id: ids.managerHistoryHeadA,
      employeeId: ids.employeeHeadA,
      managerEmployeeId: ids.employeeCeo,
      startAt: seededAt,
      endAt: null,
      createdAt: seededAt,
    },
    {
      id: ids.managerHistoryHeadB,
      employeeId: ids.employeeHeadB,
      managerEmployeeId: ids.employeeCeo,
      startAt: seededAt,
      endAt: null,
      createdAt: seededAt,
    },
    {
      id: ids.managerHistoryStaffA1,
      employeeId: ids.employeeStaffA1,
      managerEmployeeId: ids.employeeHeadA,
      startAt: seededAt,
      endAt: null,
      createdAt: seededAt,
    },
    {
      id: ids.managerHistoryStaffA2,
      employeeId: ids.employeeStaffA2,
      managerEmployeeId: ids.employeeHeadA,
      startAt: seededAt,
      endAt: null,
      createdAt: seededAt,
    },
    {
      id: ids.managerHistoryStaffB1,
      employeeId: ids.employeeStaffB1,
      managerEmployeeId: ids.employeeHeadB,
      startAt: seededAt,
      endAt: null,
      createdAt: seededAt,
    },
  ]);

  await db.insert(employeePositions).values([
    {
      id: ids.positionCeo,
      employeeId: ids.employeeCeo,
      title: "CEO",
      level: 10,
      startAt: seededAt,
      createdAt: seededAt,
    },
    {
      id: ids.positionHeadA,
      employeeId: ids.employeeHeadA,
      title: "Head of Dept A",
      level: 8,
      startAt: seededAt,
      createdAt: seededAt,
    },
    {
      id: ids.positionHeadB,
      employeeId: ids.employeeHeadB,
      title: "Head of Dept B",
      level: 8,
      startAt: seededAt,
      createdAt: seededAt,
    },
    {
      id: ids.positionStaffA1,
      employeeId: ids.employeeStaffA1,
      title: "Engineer A1",
      level: 6,
      startAt: seededAt,
      createdAt: seededAt,
    },
    {
      id: ids.positionStaffA2,
      employeeId: ids.employeeStaffA2,
      title: "Engineer A2",
      level: 6,
      startAt: seededAt,
      createdAt: seededAt,
    },
    {
      id: ids.positionStaffB1,
      employeeId: ids.employeeStaffB1,
      title: "Engineer B1",
      level: 6,
      startAt: seededAt,
      createdAt: seededAt,
    },
  ]);

  return buildS2Handles();
};

const insertQuestionnaireModelIndicators = async (
  db: ReturnType<typeof createDb>,
  options?: {
    modelName?: string;
    modelCreatedAt?: Date;
  },
): Promise<void> => {
  const modelCreatedAt = options?.modelCreatedAt ?? new Date("2026-01-10T08:00:00.000Z");

  await db.insert(competencyModelVersions).values({
    id: ids.modelVersionMainIndicators,
    companyId: ids.companyMain,
    name: options?.modelName ?? "Q1 Questionnaire Model",
    kind: "indicators",
    version: 1,
    status: "published",
    createdAt: modelCreatedAt,
    updatedAt: modelCreatedAt,
  });

  await db.insert(competencyGroups).values({
    id: ids.competencyGroupMain,
    companyId: ids.companyMain,
    modelVersionId: ids.modelVersionMainIndicators,
    name: "Core",
    weight: 100,
    order: 1,
    createdAt: modelCreatedAt,
    updatedAt: modelCreatedAt,
  });

  await db.insert(competencies).values([
    {
      id: ids.competencyMain,
      companyId: ids.companyMain,
      modelVersionId: ids.modelVersionMainIndicators,
      groupId: ids.competencyGroupMain,
      name: "Leadership",
      order: 1,
      createdAt: modelCreatedAt,
      updatedAt: modelCreatedAt,
    },
    {
      id: ids.competencySecondary,
      companyId: ids.companyMain,
      modelVersionId: ids.modelVersionMainIndicators,
      groupId: ids.competencyGroupMain,
      name: "Collaboration",
      order: 2,
      createdAt: modelCreatedAt,
      updatedAt: modelCreatedAt,
    },
  ]);

  await db.insert(competencyIndicators).values([
    {
      id: ids.competencyIndicatorMain1,
      companyId: ids.companyMain,
      competencyId: ids.competencyMain,
      text: "Sets clear direction",
      order: 1,
      createdAt: modelCreatedAt,
      updatedAt: modelCreatedAt,
    },
    {
      id: ids.competencyIndicatorMain2,
      companyId: ids.companyMain,
      competencyId: ids.competencyMain,
      text: "Supports team members",
      order: 2,
      createdAt: modelCreatedAt,
      updatedAt: modelCreatedAt,
    },
    {
      id: ids.competencyIndicatorMain3,
      companyId: ids.companyMain,
      competencyId: ids.competencyMain,
      text: "Delivers feedback",
      order: 3,
      createdAt: modelCreatedAt,
      updatedAt: modelCreatedAt,
    },
    {
      id: ids.competencyIndicatorSecondary1,
      companyId: ids.companyMain,
      competencyId: ids.competencySecondary,
      text: "Collaborates with peers",
      order: 1,
      createdAt: modelCreatedAt,
      updatedAt: modelCreatedAt,
    },
  ]);
};

const clearQuestionnaireModelSeed = async (db: ReturnType<typeof createDb>): Promise<void> => {
  await db.delete(competencyLevels).where(eq(competencyLevels.companyId, ids.companyMain));
  await db.delete(competencyIndicators).where(eq(competencyIndicators.companyId, ids.companyMain));
  await db.delete(competencies).where(eq(competencies.companyId, ids.companyMain));
  await db.delete(competencyGroups).where(eq(competencyGroups.companyId, ids.companyMain));
  await db
    .delete(competencyModelVersions)
    .where(eq(competencyModelVersions.companyId, ids.companyMain));
};

const insertS5 = async (db: ReturnType<typeof createDb>): Promise<Record<string, string>> => {
  await insertS2(db);

  const campaignStartAt = new Date("2026-01-10T09:00:00.000Z");
  const campaignEndAt = new Date("2026-01-20T18:00:00.000Z");
  await insertQuestionnaireModelIndicators(db, {
    modelName: "S5 Questionnaire Model",
  });

  await db.insert(campaigns).values({
    id: ids.campaignMain,
    companyId: ids.companyMain,
    name: "Q1 360 Campaign",
    modelVersionId: ids.modelVersionMainIndicators,
    status: "started",
    timezone: "Europe/Kaliningrad",
    startAt: campaignStartAt,
    endAt: campaignEndAt,
    lockedAt: null,
    createdAt: seededAt,
    updatedAt: seededAt,
  });

  await db.insert(questionnaires).values({
    id: ids.questionnaireMain,
    companyId: ids.companyMain,
    campaignId: ids.campaignMain,
    subjectEmployeeId: ids.employeeStaffA1,
    raterEmployeeId: ids.employeeHeadA,
    status: "not_started",
    draftPayload: {},
    submittedAt: null,
    createdAt: seededAt,
    updatedAt: seededAt,
  });

  await createCampaignEmployeeSnapshotsForCampaignStartInDb(db, {
    companyId: ids.companyMain,
    campaignId: ids.campaignMain,
  });

  return buildS5Handles();
};

const insertS6 = async (db: ReturnType<typeof createDb>): Promise<Record<string, string>> => {
  await insertS5(db);

  const firstDraftAt = new Date("2026-01-11T10:00:00.000Z");
  await db
    .update(questionnaires)
    .set({
      status: "in_progress",
      draftPayload: {
        indicatorResponses: {
          [ids.competencyMain]: {
            [ids.competencyIndicatorMain1]: 4,
            [ids.competencyIndicatorMain2]: 3,
          },
          [ids.competencySecondary]: {
            [ids.competencyIndicatorSecondary1]: "NA",
          },
        },
        competencyComments: {
          [ids.competencyMain]: "Уже замечаю устойчивую постановку приоритетов.",
        },
        finalComment: "Нужны ещё примеры взаимодействия с коллегами.",
      },
      firstDraftAt,
      updatedAt: firstDraftAt,
    })
    .where(eq(questionnaires.id, ids.questionnaireMain));

  await db
    .update(campaigns)
    .set({
      lockedAt: firstDraftAt,
      updatedAt: firstDraftAt,
    })
    .where(eq(campaigns.id, ids.campaignMain));

  return buildS6Handles();
};

const insertS8 = async (db: ReturnType<typeof createDb>): Promise<Record<string, string>> => {
  await insertS6(db);

  await db
    .update(campaigns)
    .set({
      status: "ended",
      updatedAt: new Date("2026-01-21T00:00:00.000Z"),
    })
    .where(eq(campaigns.id, ids.campaignMain));

  return buildS8Handles();
};

const insertS9 = async (db: ReturnType<typeof createDb>): Promise<Record<string, string>> => {
  await insertS7(db, { variant: "peers2" });

  await db
    .update(campaigns)
    .set({
      status: "completed",
      updatedAt: new Date("2026-01-22T00:00:00.000Z"),
    })
    .where(eq(campaigns.id, ids.campaignMain));

  await db
    .update(questionnaires)
    .set({
      draftPayload: {
        indicatorResponses: {
          [ids.competencyMain]: {
            [ids.competencyIndicatorMain1]: 4,
          },
          [ids.competencySecondary]: {
            [ids.competencyIndicatorSecondary1]: 4,
          },
        },
        competencyComments: {
          [ids.competencyMain]: {
            rawText: "Руководитель: системно держит фокус и приоритеты.",
            processedText: "Держит фокус команды и чётко расставляет приоритеты.",
            summaryText: "Сильный фокус и приоритизация.",
          },
          [ids.competencySecondary]: {
            rawText: "Руководитель: конструктивно взаимодействует с коллегами.",
            processedText: "Конструктивно взаимодействует с коллегами и поддерживает диалог.",
            summaryText: "Конструктивное взаимодействие с коллегами.",
          },
        },
      },
      updatedAt: new Date("2026-01-22T00:00:00.000Z"),
    })
    .where(eq(questionnaires.id, ids.questionnaireMain));

  await db
    .update(questionnaires)
    .set({
      draftPayload: {
        indicatorResponses: {
          [ids.competencyMain]: {
            [ids.competencyIndicatorMain1]: 3,
          },
          [ids.competencySecondary]: {
            [ids.competencyIndicatorSecondary1]: 3,
          },
        },
        competencyComments: {
          [ids.competencyMain]: {
            rawText: "Коллега: иногда перегружает деталями.",
            processedText: "Иногда уходит в детали, стоит чаще выделять главное.",
            summaryText: "Нужно чаще выделять главное.",
          },
        },
      },
      updatedAt: new Date("2026-01-22T00:00:00.000Z"),
    })
    .where(eq(questionnaires.id, ids.questionnaireMainInProgress));

  await db
    .update(questionnaires)
    .set({
      draftPayload: {
        indicatorResponses: {
          [ids.competencyMain]: {
            [ids.competencyIndicatorMain1]: 5,
          },
          [ids.competencySecondary]: {
            [ids.competencyIndicatorSecondary1]: "NA",
          },
        },
        competencyComments: {
          [ids.competencyMain]: {
            rawText: "Коллега: быстро реагирует на блокеры.",
            processedText: "Быстро реагирует на блокеры и помогает команде.",
            summaryText: "Быстро снимает блокеры.",
          },
        },
      },
      updatedAt: new Date("2026-01-22T00:00:00.000Z"),
    })
    .where(eq(questionnaires.id, ids.questionnaireMainSubmitted));

  await db
    .update(questionnaires)
    .set({
      draftPayload: {
        indicatorResponses: {
          [ids.competencyMain]: {
            [ids.competencyIndicatorMain1]: 2,
          },
          [ids.competencySecondary]: {
            [ids.competencyIndicatorSecondary1]: "NA",
          },
        },
        competencyComments: {
          [ids.competencyMain]: {
            rawText: "Подчиненный: не всегда объясняет контекст изменений.",
            processedText: "Иногда не хватает контекста при изменениях, полезно пояснять причины.",
            summaryText: "Нужно чаще пояснять контекст изменений.",
          },
        },
      },
      updatedAt: new Date("2026-01-22T00:00:00.000Z"),
    })
    .where(eq(questionnaires.id, ids.questionnaireMainSubordinate));

  return buildS9Handles();
};

const insertS7NaHeavyPeer = async (
  db: ReturnType<typeof createDb>,
): Promise<Record<string, string>> => {
  const modelCreatedAt = new Date("2026-01-10T08:00:00.000Z");
  await db.insert(competencyModelVersions).values({
    id: ids.modelVersionMainIndicators,
    companyId: ids.companyMain,
    name: "S7 Indicators Model",
    kind: "indicators",
    version: 1,
    status: "published",
    createdAt: modelCreatedAt,
    updatedAt: modelCreatedAt,
  });

  await db.insert(competencyGroups).values({
    id: ids.competencyGroupMain,
    companyId: ids.companyMain,
    modelVersionId: ids.modelVersionMainIndicators,
    name: "Core",
    weight: 100,
    order: 1,
    createdAt: modelCreatedAt,
    updatedAt: modelCreatedAt,
  });

  await db.insert(competencies).values({
    id: ids.competencyMain,
    companyId: ids.companyMain,
    modelVersionId: ids.modelVersionMainIndicators,
    groupId: ids.competencyGroupMain,
    name: "Leadership",
    order: 1,
    createdAt: modelCreatedAt,
    updatedAt: modelCreatedAt,
  });

  await db.insert(competencyIndicators).values([
    {
      id: ids.competencyIndicatorMain1,
      companyId: ids.companyMain,
      competencyId: ids.competencyMain,
      text: "Sets clear direction",
      order: 1,
      createdAt: modelCreatedAt,
      updatedAt: modelCreatedAt,
    },
    {
      id: ids.competencyIndicatorMain2,
      companyId: ids.companyMain,
      competencyId: ids.competencyMain,
      text: "Supports team members",
      order: 2,
      createdAt: modelCreatedAt,
      updatedAt: modelCreatedAt,
    },
    {
      id: ids.competencyIndicatorMain3,
      companyId: ids.companyMain,
      competencyId: ids.competencyMain,
      text: "Delivers feedback",
      order: 3,
      createdAt: modelCreatedAt,
      updatedAt: modelCreatedAt,
    },
  ]);

  const firstDraftAtManager = new Date("2026-01-11T09:00:00.000Z");
  const submittedAtManager = new Date("2026-01-11T09:30:00.000Z");
  const firstDraftAtPeer1 = new Date("2026-01-11T10:00:00.000Z");
  const submittedAtPeer1 = new Date("2026-01-11T10:20:00.000Z");
  const firstDraftAtPeer2 = new Date("2026-01-11T11:00:00.000Z");
  const submittedAtPeer2 = new Date("2026-01-11T11:30:00.000Z");

  await db
    .update(campaigns)
    .set({
      modelVersionId: ids.modelVersionMainIndicators,
      lockedAt: firstDraftAtManager,
      updatedAt: firstDraftAtManager,
    })
    .where(eq(campaigns.id, ids.campaignMain));

  await db.insert(campaignAssignments).values([
    {
      id: ids.campaignAssignmentSubjectManager,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeHeadA,
      raterRole: "manager",
      source: "manual",
      createdAt: modelCreatedAt,
    },
    {
      id: ids.campaignAssignmentSubjectPeer1,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeStaffA2,
      raterRole: "peer",
      source: "manual",
      createdAt: modelCreatedAt,
    },
    {
      id: ids.campaignAssignmentSubjectPeer2,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeStaffB1,
      raterRole: "peer",
      source: "manual",
      createdAt: modelCreatedAt,
    },
  ]);

  await db
    .update(questionnaires)
    .set({
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeHeadA,
      status: "submitted",
      draftPayload: {
        indicatorResponses: {
          [ids.competencyMain]: {
            [ids.competencyIndicatorMain1]: 4,
            [ids.competencyIndicatorMain2]: 4,
            [ids.competencyIndicatorMain3]: 4,
          },
        },
      },
      firstDraftAt: firstDraftAtManager,
      submittedAt: submittedAtManager,
      updatedAt: submittedAtManager,
    })
    .where(eq(questionnaires.id, ids.questionnaireMain));

  await db.insert(questionnaires).values([
    {
      id: ids.questionnaireMainInProgress,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeStaffA2,
      status: "submitted",
      draftPayload: {
        indicatorResponses: {
          [ids.competencyMain]: {
            [ids.competencyIndicatorMain1]: 5,
            [ids.competencyIndicatorMain2]: "NA",
            [ids.competencyIndicatorMain3]: "NA",
          },
        },
      },
      firstDraftAt: firstDraftAtPeer1,
      submittedAt: submittedAtPeer1,
      createdAt: firstDraftAtPeer1,
      updatedAt: submittedAtPeer1,
    },
    {
      id: ids.questionnaireMainSubmitted,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeStaffB1,
      status: "submitted",
      draftPayload: {
        indicatorResponses: {
          [ids.competencyMain]: {
            [ids.competencyIndicatorMain1]: 1,
            [ids.competencyIndicatorMain2]: 1,
            [ids.competencyIndicatorMain3]: 1,
          },
        },
      },
      firstDraftAt: firstDraftAtPeer2,
      submittedAt: submittedAtPeer2,
      createdAt: firstDraftAtPeer2,
      updatedAt: submittedAtPeer2,
    },
  ]);

  return buildS7NaHeavyPeerHandles();
};

const insertS7Peers2 = async (db: ReturnType<typeof createDb>): Promise<Record<string, string>> => {
  const modelCreatedAt = new Date("2026-01-10T08:00:00.000Z");
  await db.insert(competencyModelVersions).values({
    id: ids.modelVersionMainIndicators,
    companyId: ids.companyMain,
    name: "S7 Peers2 Model",
    kind: "indicators",
    version: 1,
    status: "published",
    createdAt: modelCreatedAt,
    updatedAt: modelCreatedAt,
  });

  await db.insert(competencyGroups).values({
    id: ids.competencyGroupMain,
    companyId: ids.companyMain,
    modelVersionId: ids.modelVersionMainIndicators,
    name: "Core",
    weight: 100,
    order: 1,
    createdAt: modelCreatedAt,
    updatedAt: modelCreatedAt,
  });

  await db.insert(competencies).values([
    {
      id: ids.competencyMain,
      companyId: ids.companyMain,
      modelVersionId: ids.modelVersionMainIndicators,
      groupId: ids.competencyGroupMain,
      name: "Leadership",
      order: 1,
      createdAt: modelCreatedAt,
      updatedAt: modelCreatedAt,
    },
    {
      id: ids.competencySecondary,
      companyId: ids.companyMain,
      modelVersionId: ids.modelVersionMainIndicators,
      groupId: ids.competencyGroupMain,
      name: "Collaboration",
      order: 2,
      createdAt: modelCreatedAt,
      updatedAt: modelCreatedAt,
    },
  ]);

  await db.insert(competencyIndicators).values([
    {
      id: ids.competencyIndicatorMain1,
      companyId: ids.companyMain,
      competencyId: ids.competencyMain,
      text: "Sets clear direction",
      order: 1,
      createdAt: modelCreatedAt,
      updatedAt: modelCreatedAt,
    },
    {
      id: ids.competencyIndicatorSecondary1,
      companyId: ids.companyMain,
      competencyId: ids.competencySecondary,
      text: "Collaborates with peers",
      order: 1,
      createdAt: modelCreatedAt,
      updatedAt: modelCreatedAt,
    },
  ]);

  const firstDraftAtManager = new Date("2026-01-11T09:00:00.000Z");
  const submittedAtManager = new Date("2026-01-11T09:30:00.000Z");
  const firstDraftAtPeer1 = new Date("2026-01-11T10:00:00.000Z");
  const submittedAtPeer1 = new Date("2026-01-11T10:20:00.000Z");
  const firstDraftAtPeer2 = new Date("2026-01-11T11:00:00.000Z");
  const submittedAtPeer2 = new Date("2026-01-11T11:30:00.000Z");
  const firstDraftAtSubordinate = new Date("2026-01-11T12:00:00.000Z");
  const submittedAtSubordinate = new Date("2026-01-11T12:15:00.000Z");

  await db
    .update(campaigns)
    .set({
      modelVersionId: ids.modelVersionMainIndicators,
      lockedAt: firstDraftAtManager,
      updatedAt: firstDraftAtManager,
    })
    .where(eq(campaigns.id, ids.campaignMain));

  await db.insert(campaignAssignments).values([
    {
      id: ids.campaignAssignmentSubjectManager,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeHeadA,
      raterRole: "manager",
      source: "manual",
      createdAt: modelCreatedAt,
    },
    {
      id: ids.campaignAssignmentSubjectPeer1,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeStaffA2,
      raterRole: "peer",
      source: "manual",
      createdAt: modelCreatedAt,
    },
    {
      id: ids.campaignAssignmentSubjectPeer2,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeStaffB1,
      raterRole: "peer",
      source: "manual",
      createdAt: modelCreatedAt,
    },
    {
      id: ids.campaignAssignmentSubjectSubordinate1,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeCeo,
      raterRole: "subordinate",
      source: "manual",
      createdAt: modelCreatedAt,
    },
  ]);

  await db
    .update(questionnaires)
    .set({
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeHeadA,
      status: "submitted",
      draftPayload: {
        indicatorResponses: {
          [ids.competencyMain]: {
            [ids.competencyIndicatorMain1]: 4,
          },
          [ids.competencySecondary]: {
            [ids.competencyIndicatorSecondary1]: 4,
          },
        },
      },
      firstDraftAt: firstDraftAtManager,
      submittedAt: submittedAtManager,
      updatedAt: submittedAtManager,
    })
    .where(eq(questionnaires.id, ids.questionnaireMain));

  await db.insert(questionnaires).values([
    {
      id: ids.questionnaireMainInProgress,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeStaffA2,
      status: "submitted",
      draftPayload: {
        indicatorResponses: {
          [ids.competencyMain]: {
            [ids.competencyIndicatorMain1]: 3,
          },
          [ids.competencySecondary]: {
            [ids.competencyIndicatorSecondary1]: 3,
          },
        },
      },
      firstDraftAt: firstDraftAtPeer1,
      submittedAt: submittedAtPeer1,
      createdAt: firstDraftAtPeer1,
      updatedAt: submittedAtPeer1,
    },
    {
      id: ids.questionnaireMainSubmitted,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeStaffB1,
      status: "submitted",
      draftPayload: {
        indicatorResponses: {
          [ids.competencyMain]: {
            [ids.competencyIndicatorMain1]: 5,
          },
          [ids.competencySecondary]: {
            [ids.competencyIndicatorSecondary1]: "NA",
          },
        },
      },
      firstDraftAt: firstDraftAtPeer2,
      submittedAt: submittedAtPeer2,
      createdAt: firstDraftAtPeer2,
      updatedAt: submittedAtPeer2,
    },
    {
      id: ids.questionnaireMainSubordinate,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeCeo,
      status: "submitted",
      draftPayload: {
        indicatorResponses: {
          [ids.competencyMain]: {
            [ids.competencyIndicatorMain1]: 2,
          },
          [ids.competencySecondary]: {
            [ids.competencyIndicatorSecondary1]: "NA",
          },
        },
      },
      firstDraftAt: firstDraftAtSubordinate,
      submittedAt: submittedAtSubordinate,
      createdAt: firstDraftAtSubordinate,
      updatedAt: submittedAtSubordinate,
    },
  ]);

  return buildS7Peers2Handles();
};

const insertS7NoSubordinates = async (
  db: ReturnType<typeof createDb>,
): Promise<Record<string, string>> => {
  const modelCreatedAt = new Date("2026-01-10T08:00:00.000Z");
  await db.insert(competencyModelVersions).values({
    id: ids.modelVersionMainIndicators,
    companyId: ids.companyMain,
    name: "S7 No Subordinates Model",
    kind: "indicators",
    version: 1,
    status: "published",
    createdAt: modelCreatedAt,
    updatedAt: modelCreatedAt,
  });

  await db.insert(competencyGroups).values({
    id: ids.competencyGroupMain,
    companyId: ids.companyMain,
    modelVersionId: ids.modelVersionMainIndicators,
    name: "Core",
    weight: 100,
    order: 1,
    createdAt: modelCreatedAt,
    updatedAt: modelCreatedAt,
  });

  await db.insert(competencies).values({
    id: ids.competencyMain,
    companyId: ids.companyMain,
    modelVersionId: ids.modelVersionMainIndicators,
    groupId: ids.competencyGroupMain,
    name: "Leadership",
    order: 1,
    createdAt: modelCreatedAt,
    updatedAt: modelCreatedAt,
  });

  await db.insert(competencyIndicators).values({
    id: ids.competencyIndicatorMain1,
    companyId: ids.companyMain,
    competencyId: ids.competencyMain,
    text: "Sets clear direction",
    order: 1,
    createdAt: modelCreatedAt,
    updatedAt: modelCreatedAt,
  });

  const firstDraftAtManager = new Date("2026-01-11T09:00:00.000Z");
  const submittedAtManager = new Date("2026-01-11T09:20:00.000Z");
  const firstDraftAtPeer1 = new Date("2026-01-11T10:00:00.000Z");
  const submittedAtPeer1 = new Date("2026-01-11T10:15:00.000Z");
  const firstDraftAtPeer2 = new Date("2026-01-11T11:00:00.000Z");
  const submittedAtPeer2 = new Date("2026-01-11T11:20:00.000Z");
  const firstDraftAtPeer3 = new Date("2026-01-11T12:00:00.000Z");
  const submittedAtPeer3 = new Date("2026-01-11T12:20:00.000Z");

  await db
    .update(campaigns)
    .set({
      modelVersionId: ids.modelVersionMainIndicators,
      lockedAt: firstDraftAtManager,
      updatedAt: firstDraftAtManager,
    })
    .where(eq(campaigns.id, ids.campaignMain));

  await db.insert(campaignAssignments).values([
    {
      id: ids.campaignAssignmentSubjectManager,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeHeadA,
      raterRole: "manager",
      source: "manual",
      createdAt: modelCreatedAt,
    },
    {
      id: ids.campaignAssignmentSubjectPeer1,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeStaffA2,
      raterRole: "peer",
      source: "manual",
      createdAt: modelCreatedAt,
    },
    {
      id: ids.campaignAssignmentSubjectPeer2,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeStaffB1,
      raterRole: "peer",
      source: "manual",
      createdAt: modelCreatedAt,
    },
    {
      id: ids.campaignAssignmentSubjectPeer3,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeCeo,
      raterRole: "peer",
      source: "manual",
      createdAt: modelCreatedAt,
    },
  ]);

  await db
    .update(questionnaires)
    .set({
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeHeadA,
      status: "submitted",
      draftPayload: {
        indicatorResponses: {
          [ids.competencyMain]: {
            [ids.competencyIndicatorMain1]: 4,
          },
        },
      },
      firstDraftAt: firstDraftAtManager,
      submittedAt: submittedAtManager,
      updatedAt: submittedAtManager,
    })
    .where(eq(questionnaires.id, ids.questionnaireMain));

  await db.insert(questionnaires).values([
    {
      id: ids.questionnaireMainInProgress,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeStaffA2,
      status: "submitted",
      draftPayload: {
        indicatorResponses: {
          [ids.competencyMain]: {
            [ids.competencyIndicatorMain1]: 2,
          },
        },
      },
      firstDraftAt: firstDraftAtPeer1,
      submittedAt: submittedAtPeer1,
      createdAt: firstDraftAtPeer1,
      updatedAt: submittedAtPeer1,
    },
    {
      id: ids.questionnaireMainSubmitted,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeStaffB1,
      status: "submitted",
      draftPayload: {
        indicatorResponses: {
          [ids.competencyMain]: {
            [ids.competencyIndicatorMain1]: 3,
          },
        },
      },
      firstDraftAt: firstDraftAtPeer2,
      submittedAt: submittedAtPeer2,
      createdAt: firstDraftAtPeer2,
      updatedAt: submittedAtPeer2,
    },
    {
      id: ids.questionnaireMainPeer3,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeCeo,
      status: "submitted",
      draftPayload: {
        indicatorResponses: {
          [ids.competencyMain]: {
            [ids.competencyIndicatorMain1]: 4,
          },
        },
      },
      firstDraftAt: firstDraftAtPeer3,
      submittedAt: submittedAtPeer3,
      createdAt: firstDraftAtPeer3,
      updatedAt: submittedAtPeer3,
    },
  ]);

  return buildS7NoSubordinatesHandles();
};

const insertS7LevelsTie = async (
  db: ReturnType<typeof createDb>,
): Promise<Record<string, string>> => {
  const modelCreatedAt = new Date("2026-01-10T08:00:00.000Z");
  await db.insert(competencyModelVersions).values({
    id: ids.modelVersionMainLevels,
    companyId: ids.companyMain,
    name: "S7 Levels Tie Model",
    kind: "levels",
    version: 1,
    status: "published",
    createdAt: modelCreatedAt,
    updatedAt: modelCreatedAt,
  });

  await db.insert(competencyGroups).values({
    id: ids.competencyGroupMain,
    companyId: ids.companyMain,
    modelVersionId: ids.modelVersionMainLevels,
    name: "Core",
    weight: 100,
    order: 1,
    createdAt: modelCreatedAt,
    updatedAt: modelCreatedAt,
  });

  await db.insert(competencies).values({
    id: ids.competencyMain,
    companyId: ids.companyMain,
    modelVersionId: ids.modelVersionMainLevels,
    groupId: ids.competencyGroupMain,
    name: "Leadership",
    order: 1,
    createdAt: modelCreatedAt,
    updatedAt: modelCreatedAt,
  });

  await db.insert(competencyLevels).values([
    {
      id: ids.competencyLevelMain1,
      companyId: ids.companyMain,
      competencyId: ids.competencyMain,
      level: 1,
      text: "Level 1",
      createdAt: modelCreatedAt,
      updatedAt: modelCreatedAt,
    },
    {
      id: ids.competencyLevelMain2,
      companyId: ids.companyMain,
      competencyId: ids.competencyMain,
      level: 2,
      text: "Level 2",
      createdAt: modelCreatedAt,
      updatedAt: modelCreatedAt,
    },
    {
      id: ids.competencyLevelMain3,
      companyId: ids.companyMain,
      competencyId: ids.competencyMain,
      level: 3,
      text: "Level 3",
      createdAt: modelCreatedAt,
      updatedAt: modelCreatedAt,
    },
    {
      id: ids.competencyLevelMain4,
      companyId: ids.companyMain,
      competencyId: ids.competencyMain,
      level: 4,
      text: "Level 4",
      createdAt: modelCreatedAt,
      updatedAt: modelCreatedAt,
    },
  ]);

  const firstDraftAtManager = new Date("2026-01-11T09:00:00.000Z");
  const submittedAtManager = new Date("2026-01-11T09:20:00.000Z");
  const firstDraftAtPeer1 = new Date("2026-01-11T10:00:00.000Z");
  const submittedAtPeer1 = new Date("2026-01-11T10:20:00.000Z");
  const firstDraftAtPeer2 = new Date("2026-01-11T11:00:00.000Z");
  const submittedAtPeer2 = new Date("2026-01-11T11:20:00.000Z");
  const firstDraftAtSubordinate1 = new Date("2026-01-11T12:00:00.000Z");
  const submittedAtSubordinate1 = new Date("2026-01-11T12:20:00.000Z");
  const firstDraftAtSubordinate2 = new Date("2026-01-11T13:00:00.000Z");
  const submittedAtSubordinate2 = new Date("2026-01-11T13:20:00.000Z");

  await db
    .update(campaigns)
    .set({
      modelVersionId: ids.modelVersionMainLevels,
      lockedAt: firstDraftAtManager,
      updatedAt: firstDraftAtManager,
    })
    .where(eq(campaigns.id, ids.campaignMain));

  await db.insert(campaignAssignments).values([
    {
      id: ids.campaignAssignmentSubjectManager,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeHeadA,
      raterRole: "manager",
      source: "manual",
      createdAt: modelCreatedAt,
    },
    {
      id: ids.campaignAssignmentSubjectPeer1,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeStaffA2,
      raterRole: "peer",
      source: "manual",
      createdAt: modelCreatedAt,
    },
    {
      id: ids.campaignAssignmentSubjectPeer2,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeStaffB1,
      raterRole: "peer",
      source: "manual",
      createdAt: modelCreatedAt,
    },
    {
      id: ids.campaignAssignmentSubjectSubordinate1,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeCeo,
      raterRole: "subordinate",
      source: "manual",
      createdAt: modelCreatedAt,
    },
    {
      id: ids.campaignAssignmentSubjectPeer3,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeHeadB,
      raterRole: "subordinate",
      source: "manual",
      createdAt: modelCreatedAt,
    },
  ]);

  await db
    .update(questionnaires)
    .set({
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeHeadA,
      status: "submitted",
      draftPayload: {
        levelResponses: {
          [ids.competencyMain]: "UNSURE",
        },
      },
      firstDraftAt: firstDraftAtManager,
      submittedAt: submittedAtManager,
      updatedAt: submittedAtManager,
    })
    .where(eq(questionnaires.id, ids.questionnaireMain));

  await db.insert(questionnaires).values([
    {
      id: ids.questionnaireMainInProgress,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeStaffA2,
      status: "submitted",
      draftPayload: {
        levelResponses: {
          [ids.competencyMain]: 2,
        },
      },
      firstDraftAt: firstDraftAtPeer1,
      submittedAt: submittedAtPeer1,
      createdAt: firstDraftAtPeer1,
      updatedAt: submittedAtPeer1,
    },
    {
      id: ids.questionnaireMainSubmitted,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeStaffB1,
      status: "submitted",
      draftPayload: {
        levelResponses: {
          [ids.competencyMain]: 3,
        },
      },
      firstDraftAt: firstDraftAtPeer2,
      submittedAt: submittedAtPeer2,
      createdAt: firstDraftAtPeer2,
      updatedAt: submittedAtPeer2,
    },
    {
      id: ids.questionnaireMainSubordinate,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeCeo,
      status: "submitted",
      draftPayload: {
        levelResponses: {
          [ids.competencyMain]: 2,
        },
      },
      firstDraftAt: firstDraftAtSubordinate1,
      submittedAt: submittedAtSubordinate1,
      createdAt: firstDraftAtSubordinate1,
      updatedAt: submittedAtSubordinate1,
    },
    {
      id: ids.questionnaireMainPeer3,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA1,
      raterEmployeeId: ids.employeeHeadB,
      status: "submitted",
      draftPayload: {
        levelResponses: {
          [ids.competencyMain]: 3,
        },
      },
      firstDraftAt: firstDraftAtSubordinate2,
      submittedAt: submittedAtSubordinate2,
      createdAt: firstDraftAtSubordinate2,
      updatedAt: submittedAtSubordinate2,
    },
  ]);

  return buildS7LevelsTieHandles();
};

const insertS7 = async (
  db: ReturnType<typeof createDb>,
  options?: { variant?: string },
): Promise<Record<string, string>> => {
  await insertS5(db);

  if (
    options?.variant &&
    options.variant !== "na_heavy_peer" &&
    options.variant !== "peers2" &&
    options.variant !== "no_subordinates" &&
    options.variant !== "levels_tie"
  ) {
    throw new Error(
      `Unsupported variant for S7_campaign_started_some_submitted: ${options.variant}`,
    );
  }

  if (options?.variant === "na_heavy_peer") {
    await clearQuestionnaireModelSeed(db);
    return insertS7NaHeavyPeer(db);
  }

  if (options?.variant === "peers2") {
    await clearQuestionnaireModelSeed(db);
    return insertS7Peers2(db);
  }

  if (options?.variant === "no_subordinates") {
    await clearQuestionnaireModelSeed(db);
    return insertS7NoSubordinates(db);
  }

  if (options?.variant === "levels_tie") {
    await clearQuestionnaireModelSeed(db);
    return insertS7LevelsTie(db);
  }

  const firstDraftAtInProgress = new Date("2026-01-11T10:00:00.000Z");
  const firstDraftAtSubmitted = new Date("2026-01-11T12:00:00.000Z");
  const submittedAt = new Date("2026-01-12T09:00:00.000Z");

  await db.insert(questionnaires).values([
    {
      id: ids.questionnaireMainInProgress,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffA2,
      raterEmployeeId: ids.employeeHeadA,
      status: "in_progress",
      draftPayload: {
        indicatorResponses: {
          [ids.competencyMain]: {
            [ids.competencyIndicatorMain1]: 4,
            [ids.competencyIndicatorMain2]: 3,
          },
          [ids.competencySecondary]: {
            [ids.competencyIndicatorSecondary1]: "NA",
          },
        },
        competencyComments: {
          [ids.competencyMain]: "Черновик: уверенно ведёт команду по приоритетам.",
        },
        finalComment: "Нужно добавить кейсы по взаимодействию с коллегами.",
      },
      firstDraftAt: firstDraftAtInProgress,
      submittedAt: null,
      createdAt: firstDraftAtInProgress,
      updatedAt: firstDraftAtInProgress,
    },
    {
      id: ids.questionnaireMainSubmitted,
      companyId: ids.companyMain,
      campaignId: ids.campaignMain,
      subjectEmployeeId: ids.employeeStaffB1,
      raterEmployeeId: ids.employeeHeadB,
      status: "submitted",
      draftPayload: {
        indicatorResponses: {
          [ids.competencyMain]: {
            [ids.competencyIndicatorMain1]: 5,
            [ids.competencyIndicatorMain2]: 4,
            [ids.competencyIndicatorMain3]: 5,
          },
          [ids.competencySecondary]: {
            [ids.competencyIndicatorSecondary1]: 4,
          },
        },
        competencyComments: {
          [ids.competencyMain]: "Сильная постановка целей и обратная связь.",
          [ids.competencySecondary]: "Хорошо держит контакт с другими командами.",
        },
        finalComment: "В целом уверенный и зрелый стиль руководства.",
      },
      firstDraftAt: firstDraftAtSubmitted,
      submittedAt,
      createdAt: firstDraftAtSubmitted,
      updatedAt: submittedAt,
    },
  ]);

  await db
    .update(campaigns)
    .set({
      lockedAt: firstDraftAtInProgress,
      updatedAt: firstDraftAtInProgress,
    })
    .where(eq(campaigns.id, ids.campaignMain));

  return buildS7Handles();
};

const insertS4 = async (
  db: ReturnType<typeof createDb>,
  options?: { variant?: string },
): Promise<Record<string, string>> => {
  await insertS2(db);

  const campaignStartAt = new Date("2026-01-15T09:00:00.000Z");
  const campaignEndAt = new Date("2026-01-30T18:00:00.000Z");
  const modelCreatedAt = new Date("2026-01-10T08:00:00.000Z");

  await db.insert(competencyModelVersions).values({
    id: ids.modelVersionMainIndicators,
    companyId: ids.companyMain,
    name: "S4 Draft Model",
    kind: "indicators",
    version: 1,
    status: "published",
    createdAt: modelCreatedAt,
    updatedAt: modelCreatedAt,
  });

  await db.insert(competencyGroups).values({
    id: ids.competencyGroupMain,
    companyId: ids.companyMain,
    modelVersionId: ids.modelVersionMainIndicators,
    name: "Core",
    weight: 100,
    order: 1,
    createdAt: modelCreatedAt,
    updatedAt: modelCreatedAt,
  });

  await db.insert(competencies).values({
    id: ids.competencyMain,
    companyId: ids.companyMain,
    modelVersionId: ids.modelVersionMainIndicators,
    groupId: ids.competencyGroupMain,
    name: "Leadership",
    order: 1,
    createdAt: modelCreatedAt,
    updatedAt: modelCreatedAt,
  });

  await db.insert(competencyIndicators).values([
    {
      id: ids.competencyIndicatorMain1,
      companyId: ids.companyMain,
      competencyId: ids.competencyMain,
      text: "Sets clear direction",
      order: 1,
      createdAt: modelCreatedAt,
      updatedAt: modelCreatedAt,
    },
    {
      id: ids.competencyIndicatorMain2,
      companyId: ids.companyMain,
      competencyId: ids.competencyMain,
      text: "Supports team members",
      order: 2,
      createdAt: modelCreatedAt,
      updatedAt: modelCreatedAt,
    },
  ]);

  await db.insert(campaigns).values({
    id: ids.campaignMain,
    companyId: ids.companyMain,
    name: "Q1 Draft Campaign",
    modelVersionId: ids.modelVersionMainIndicators,
    status: "draft",
    timezone: "Europe/Kaliningrad",
    startAt: campaignStartAt,
    endAt: campaignEndAt,
    lockedAt: null,
    createdAt: seededAt,
    updatedAt: seededAt,
  });

  if (options?.variant && options.variant !== "no_participants") {
    throw new Error(`Unsupported variant for S4_campaign_draft: ${options.variant}`);
  }

  return buildS4Handles();
};

export const runSeedScenario = async (input: SeedRunInput): Promise<SeedRunOutput> => {
  const parsed = parseSeedRunInput(input);

  if (
    parsed.variant &&
    !(
      (parsed.scenario === "S4_campaign_draft" && parsed.variant === "no_participants") ||
      (parsed.scenario === "S7_campaign_started_some_submitted" &&
        (parsed.variant === "na_heavy_peer" ||
          parsed.variant === "peers2" ||
          parsed.variant === "no_subordinates" ||
          parsed.variant === "levels_tie"))
    )
  ) {
    throw new Error(`Unsupported seed variant for ${parsed.scenario}: ${parsed.variant}`);
  }

  const pool = createPool();
  const client = await pool.connect();

  try {
    const db = createDb(client);
    await db.execute(seedAdvisoryLockSql);
    await resetDatabase(db);

    let handles: Record<string, string>;
    switch (parsed.scenario) {
      case "S0_empty":
        handles = {};
        break;
      case "S1_company_min":
        handles = await insertS1(db);
        break;
      case "S1_multi_tenant_min":
        handles = await insertS1MultiTenant(db);
        break;
      case "S2_org_basic":
        handles = await insertS2(db);
        break;
      case "S4_campaign_draft":
        handles = await insertS4(db, {
          variant: parsed.variant,
        });
        break;
      case "S5_campaign_started_no_answers":
        handles = await insertS5(db);
        break;
      case "S6_campaign_started_some_drafts":
        handles = await insertS6(db);
        break;
      case "S7_campaign_started_some_submitted":
        handles = await insertS7(db, {
          variant: parsed.variant,
        });
        break;
      case "S8_campaign_ended":
        handles = await insertS8(db);
        break;
      case "S9_campaign_completed_with_ai":
        handles = await insertS9(db);
        break;
      default:
        throw new Error(`Unsupported seed scenario: ${parsed.scenario}`);
    }

    return parseSeedRunOutput({
      scenario: parsed.scenario,
      handles,
    });
  } finally {
    try {
      const db = createDb(client);
      await db.execute(seedAdvisoryUnlockSql);
    } catch {}
    client.release();
    await pool.end();
  }
};
