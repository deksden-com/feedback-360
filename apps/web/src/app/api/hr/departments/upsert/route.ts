import { createInprocClient } from "@feedback-360/client";
import { NextResponse } from "next/server";

import { resolveAppOperationContext } from "@/lib/operation-context";

const getString = (formData: FormData, key: string): string | undefined => {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
};

const toBool = (value: FormDataEntryValue | null): boolean | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  return value === "true" || value === "on";
};

export async function POST(request: Request) {
  const resolved = await resolveAppOperationContext();
  if (!resolved.ok) {
    const url = new URL(
      resolved.error.code === "active_company_required" ? "/select-company" : "/auth/login",
      request.url,
    );
    return NextResponse.redirect(url);
  }

  if (resolved.context.role !== "hr_admin") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const returnTo = getString(formData, "returnTo") ?? "/hr/org";
  const departmentId = getString(formData, "departmentId") ?? crypto.randomUUID();
  const name = getString(formData, "name");
  const parentDepartmentId = getString(formData, "parentDepartmentId");
  const isActive = toBool(formData.get("isActive"));
  const url = new URL(returnTo, request.url);

  if (!name) {
    url.searchParams.set("flash", "error");
    return NextResponse.redirect(url);
  }

  const client = createInprocClient();
  const result = await client.departmentUpsert(
    {
      departmentId,
      name,
      ...(parentDepartmentId ? { parentDepartmentId } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
    resolved.context,
  );

  if (result.ok) {
    url.searchParams.set("departmentId", result.data.departmentId);
  }
  url.searchParams.set("flash", result.ok ? "department-saved" : "error");
  return NextResponse.redirect(url);
}
