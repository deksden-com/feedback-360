import {
  type SeedRunInput,
  type SeedRunOutput,
  parseSeedRunInput,
  parseSeedRunOutput,
} from "@feedback-360/api-contract";
import { eq, sql } from "drizzle-orm";

import { createDb, createPool } from "./db";
import {
  campaigns,
  companies,
  companyMemberships,
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
  positionCeo: "17000000-0000-4000-8000-000000000002",
  positionHeadA: "17000000-0000-4000-8000-000000000003",
  positionHeadB: "17000000-0000-4000-8000-000000000004",
  positionStaffA1: "17000000-0000-4000-8000-000000000005",
  positionStaffA2: "17000000-0000-4000-8000-000000000006",
  positionStaffB1: "17000000-0000-4000-8000-000000000007",
  userHrAdmin: "18000000-0000-4000-8000-000000000001",
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
  questionnaireCompanyA: "20000000-0000-4000-8000-000000000010",
  questionnaireCompanyB: "20000000-0000-4000-8000-000000000011",
} as const;

const truncateSql = sql.raw(`
  truncate table
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

const resetDatabase = async (db: ReturnType<typeof createDb>): Promise<void> => {
  await db.execute(truncateSql);
};

const buildS1Handles = (): Record<string, string> => {
  return {
    "company.main": ids.companyMain,
    "employee.hr_admin": ids.employeeHrAdmin,
    "membership.hr_admin@company.main": ids.membershipHrAdmin,
    "user.hr_admin": ids.userHrAdmin,
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

  await db.insert(employees).values({
    id: ids.employeeHrAdmin,
    companyId: ids.companyMain,
    email: "hr.admin@acme.example",
    firstName: "HR",
    lastName: "Admin",
    phone: "+10000000001",
    isActive: true,
    createdAt: seededAt,
    updatedAt: seededAt,
  });

  await db.insert(companyMemberships).values({
    id: ids.membershipHrAdmin,
    companyId: ids.companyMain,
    userId: ids.userHrAdmin,
    role: "hr_admin",
    createdAt: seededAt,
  });

  await db.insert(employeeUserLinks).values({
    id: ids.employeeLinkHrAdmin,
    companyId: ids.companyMain,
    employeeId: ids.employeeHrAdmin,
    userId: ids.userHrAdmin,
    createdAt: seededAt,
  });

  await db.insert(employeePositions).values({
    id: ids.positionHrAdmin,
    employeeId: ids.employeeHrAdmin,
    title: "HR Admin",
    level: 8,
    startAt: seededAt,
    createdAt: seededAt,
  });

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
    "campaign.main": ids.campaignMain,
    "questionnaire.main": ids.questionnaireMain,
  };
};

const buildS8Handles = (): Record<string, string> => {
  return buildS5Handles();
};

const buildS4Handles = (): Record<string, string> => {
  return {
    ...buildS2Handles(),
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

const insertS5 = async (db: ReturnType<typeof createDb>): Promise<Record<string, string>> => {
  await insertS2(db);

  const campaignStartAt = new Date("2026-01-10T09:00:00.000Z");
  const campaignEndAt = new Date("2026-01-20T18:00:00.000Z");

  await db.insert(campaigns).values({
    id: ids.campaignMain,
    companyId: ids.companyMain,
    name: "Q1 360 Campaign",
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

const insertS8 = async (db: ReturnType<typeof createDb>): Promise<Record<string, string>> => {
  await insertS5(db);

  await db
    .update(campaigns)
    .set({
      status: "ended",
      updatedAt: new Date("2026-01-21T00:00:00.000Z"),
    })
    .where(eq(campaigns.id, ids.campaignMain));

  return buildS8Handles();
};

const insertS4 = async (
  db: ReturnType<typeof createDb>,
  options?: { variant?: string },
): Promise<Record<string, string>> => {
  await insertS2(db);

  const campaignStartAt = new Date("2026-01-15T09:00:00.000Z");
  const campaignEndAt = new Date("2026-01-30T18:00:00.000Z");

  await db.insert(campaigns).values({
    id: ids.campaignMain,
    companyId: ids.companyMain,
    name: "Q1 Draft Campaign",
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
    !(parsed.scenario === "S4_campaign_draft" && parsed.variant === "no_participants")
  ) {
    throw new Error(`Unsupported seed variant for ${parsed.scenario}: ${parsed.variant}`);
  }

  const pool = createPool();

  try {
    const db = createDb(pool);
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
      case "S8_campaign_ended":
        handles = await insertS8(db);
        break;
      default:
        throw new Error(`Unsupported seed scenario: ${parsed.scenario}`);
    }

    return parseSeedRunOutput({
      scenario: parsed.scenario,
      handles,
    });
  } finally {
    await pool.end();
  }
};
