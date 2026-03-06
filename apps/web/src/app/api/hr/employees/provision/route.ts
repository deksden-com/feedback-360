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
  const returnTo = getString(formData, "returnTo") ?? "/hr/employees";
  const employeeId = getString(formData, "employeeId");
  const userId = getString(formData, "userId");
  const email = getString(formData, "email");
  const role = getString(formData, "role");

  if (!employeeId || !userId || !email || !role) {
    const errorUrl = new URL(returnTo, request.url);
    errorUrl.searchParams.set("flash", "error");
    return NextResponse.redirect(errorUrl);
  }

  const client = createInprocClient();
  const result = await client.identityProvisionAccess(
    {
      employeeId,
      userId,
      email,
      role: role as "hr_admin" | "hr_reader" | "manager" | "employee",
    },
    resolved.context,
  );

  const url = new URL(returnTo, request.url);
  url.searchParams.set("flash", result.ok ? "provisioned" : "error");
  return NextResponse.redirect(url);
}
