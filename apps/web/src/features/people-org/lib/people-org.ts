import type {
  DepartmentListItem,
  EmployeeDirectoryListItem,
  MembershipRole,
} from "@feedback-360/api-contract";

export const getQueryValue = (value: string | string[] | undefined): string | undefined => {
  if (typeof value === "string") {
    return value.trim().length > 0 ? value.trim() : undefined;
  }
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0] ?? "";
    return first.trim().length > 0 ? first.trim() : undefined;
  }
  return undefined;
};

export const getEmployeeDisplayName = (
  employee: Pick<EmployeeDirectoryListItem, "firstName" | "lastName" | "email">,
): string => {
  const parts = [employee.firstName, employee.lastName].filter(
    (part): part is string => typeof part === "string" && part.trim().length > 0,
  );
  return parts.length > 0 ? parts.join(" ") : employee.email;
};

export const getDisplayInitials = (value: string): string => {
  const parts = value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    return "—";
  }

  if (parts.length === 1) {
    return (parts[0]?.slice(0, 2) ?? "—").toUpperCase();
  }

  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
};

export const getShortIdentifier = (value: string, visible = 6): string => {
  if (value.length <= visible) {
    return value;
  }

  return `${value.slice(0, visible)}…`;
};

export const getRoleLabel = (role?: MembershipRole): string | undefined => {
  if (!role) {
    return undefined;
  }

  const labels: Record<MembershipRole, string> = {
    hr_admin: "HR Admin",
    hr_reader: "HR Reader",
    manager: "Руководитель",
    employee: "Сотрудник",
  };

  return labels[role] ?? role;
};

export const getEmployeeStatusBadges = (
  employee: Pick<EmployeeDirectoryListItem, "isActive" | "deletedAt">,
): Array<{ label: string; tone: "default" | "warning" | "error" }> => {
  const badges: Array<{ label: string; tone: "default" | "warning" | "error" }> = [];

  if (employee.isActive && !employee.deletedAt) {
    badges.push({ label: "Активен", tone: "default" });
  }
  if (!employee.isActive) {
    badges.push({ label: "Неактивен", tone: "warning" });
  }
  if (employee.deletedAt) {
    badges.push({ label: "Soft deleted", tone: "error" });
  }

  return badges;
};

export const getBadgeClassName = (tone: "default" | "warning" | "error"): string => {
  if (tone === "warning") {
    return "border-amber-300 bg-amber-50 text-amber-950";
  }
  if (tone === "error") {
    return "border-destructive/40 bg-destructive/5 text-destructive";
  }
  return "border-border bg-muted/20 text-foreground";
};

export const getBadgeVariant = (
  tone: "default" | "warning" | "error",
): "neutral" | "warning" | "danger" => {
  if (tone === "warning") {
    return "warning";
  }
  if (tone === "error") {
    return "danger";
  }
  return "neutral";
};

export const buildDepartmentTree = (items: DepartmentListItem[]) => {
  const byParent = new Map<string | undefined, DepartmentListItem[]>();
  for (const item of items) {
    const key = item.parentDepartmentId;
    const existing = byParent.get(key) ?? [];
    existing.push(item);
    byParent.set(key, existing);
  }

  const visit = (
    parentDepartmentId: string | undefined,
    depth: number,
  ): Array<DepartmentListItem & { depth: number }> => {
    const siblings = [...(byParent.get(parentDepartmentId) ?? [])].sort((left, right) =>
      left.name.localeCompare(right.name),
    );
    return siblings.flatMap((item) => [{ ...item, depth }, ...visit(item.departmentId, depth + 1)]);
  };

  return visit(undefined, 0);
};
