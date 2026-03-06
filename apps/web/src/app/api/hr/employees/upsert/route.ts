import { createInprocClient } from "@feedback-360/client";
import { NextResponse } from "next/server";

import { resolveAppOperationContext } from "@/lib/operation-context";

const toBool = (value: FormDataEntryValue | null): boolean | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  return value === "true" || value === "on";
};

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
  const client = createInprocClient();
  const employeeId = getString(formData, "employeeId") ?? crypto.randomUUID();
  const result = await client.employeeUpsert(
    {
      employeeId,
      email: getString(formData, "email"),
      firstName: getString(formData, "firstName"),
      lastName: getString(formData, "lastName"),
      phone: getString(formData, "phone"),
      telegramUserId: getString(formData, "telegramUserId"),
      telegramChatId: getString(formData, "telegramChatId"),
      isActive: toBool(formData.get("isActive")),
    },
    resolved.context,
  );

  const url = new URL(returnTo, request.url);
  if (!result.ok) {
    url.searchParams.set("flash", "error");
    return NextResponse.redirect(url);
  }

  if (returnTo === "/hr/employees") {
    url.pathname = `/hr/employees/${result.data.employeeId}`;
  }
  url.searchParams.set("flash", "saved");
  return NextResponse.redirect(url);
}
