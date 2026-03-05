import { type MembershipRole, createOperationError } from "@feedback-360/api-contract";
import { and, eq, or } from "drizzle-orm";

import { createDb, createPool } from "./db";
import { companyMemberships, employeeUserLinks, employees } from "./schema";

export type IdentityProvisionLinkInput = {
  companyId: string;
  employeeId: string;
  role: MembershipRole;
};

export type IdentityProvisionInput = {
  userId: string;
  email: string;
  links: IdentityProvisionLinkInput[];
};

export type IdentityProvisionOutput = {
  userId: string;
  email: string;
  links: Array<{
    companyId: string;
    employeeId: string;
    role: MembershipRole;
    membershipId: string;
    employeeUserLinkId: string;
  }>;
};

export const provisionIdentityAccess = async (
  input: IdentityProvisionInput,
): Promise<IdentityProvisionOutput> => {
  const normalizedEmail = input.email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw createOperationError("invalid_input", "Email is required for identity provisioning.");
  }

  if (input.links.length === 0) {
    throw createOperationError(
      "invalid_input",
      "At least one company/employee link is required for identity provisioning.",
    );
  }

  const pool = createPool();

  try {
    const db = createDb(pool);
    const links = await db.transaction(async (tx) => {
      const outputLinks: IdentityProvisionOutput["links"] = [];

      for (const link of input.links) {
        const now = new Date();
        const [employeeRow] = await tx
          .update(employees)
          .set({
            email: normalizedEmail,
            isActive: true,
            deletedAt: null,
            updatedAt: now,
          })
          .where(and(eq(employees.id, link.employeeId), eq(employees.companyId, link.companyId)))
          .returning({
            employeeId: employees.id,
          });

        if (!employeeRow) {
          throw createOperationError(
            "not_found",
            "Employee is not found in company for identity provisioning.",
            {
              companyId: link.companyId,
              employeeId: link.employeeId,
            },
          );
        }

        const [membershipRow] = await tx
          .insert(companyMemberships)
          .values({
            companyId: link.companyId,
            userId: input.userId,
            role: link.role,
            createdAt: now,
          })
          .onConflictDoUpdate({
            target: [companyMemberships.userId, companyMemberships.companyId],
            set: {
              role: link.role,
            },
          })
          .returning({
            membershipId: companyMemberships.id,
            role: companyMemberships.role,
          });

        if (!membershipRow) {
          throw createOperationError("invalid_input", "Failed to create company membership.");
        }

        await tx
          .delete(employeeUserLinks)
          .where(
            and(
              eq(employeeUserLinks.companyId, link.companyId),
              or(
                eq(employeeUserLinks.employeeId, link.employeeId),
                eq(employeeUserLinks.userId, input.userId),
              ),
            ),
          );

        const [employeeUserLinkRow] = await tx
          .insert(employeeUserLinks)
          .values({
            companyId: link.companyId,
            employeeId: link.employeeId,
            userId: input.userId,
            createdAt: now,
          })
          .returning({
            employeeUserLinkId: employeeUserLinks.id,
          });

        if (!employeeUserLinkRow) {
          throw createOperationError("invalid_input", "Failed to create employee-user link.");
        }

        outputLinks.push({
          companyId: link.companyId,
          employeeId: link.employeeId,
          role: membershipRow.role as MembershipRole,
          membershipId: membershipRow.membershipId,
          employeeUserLinkId: employeeUserLinkRow.employeeUserLinkId,
        });
      }

      return outputLinks;
    });

    return {
      userId: input.userId,
      email: normalizedEmail,
      links,
    };
  } finally {
    await pool.end();
  }
};
