import { createInprocClient } from "@feedback-360/client";
import { NextResponse } from "next/server";

import { resolveAppOperationContext } from "@/lib/operation-context";

const getString = (formData: FormData, key: string): string | undefined => {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
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
  const employeeId = getString(formData, "employeeId");
  const toDepartmentId = getString(formData, "toDepartmentId");
  const returnTo = getString(formData, "returnTo") ?? "/hr/org";
  const url = new URL(returnTo, request.url);

  if (!employeeId || !toDepartmentId) {
    url.searchParams.set("flash", "error");
    return NextResponse.redirect(url);
  }

  const client = createInprocClient();
  const result = await client.orgDepartmentMove({ employeeId, toDepartmentId }, resolved.context);
  url.searchParams.set("flash", result.ok ? "moved" : "error");
  return NextResponse.redirect(url);
}
