import { APP_ACTIVE_COMPANY_COOKIE } from "@/lib/app-session";
import { NextResponse } from "next/server";

const oneMonthInSeconds = 60 * 60 * 24 * 30;
const shouldUseSecureCookie = process.env.APP_ENV === "prod";

const readCompanyId = async (request: Request): Promise<string | undefined> => {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { companyId?: unknown };
    if (typeof body.companyId === "string" && body.companyId.trim().length > 0) {
      return body.companyId.trim();
    }
    return undefined;
  }

  const formData = await request.formData();
  const companyId = formData.get("companyId");
  if (typeof companyId === "string" && companyId.trim().length > 0) {
    return companyId.trim();
  }
  return undefined;
};

export async function POST(request: Request) {
  const companyId = await readCompanyId(request);
  if (!companyId) {
    return NextResponse.json(
      {
        ok: false,
        error: "companyId is required.",
      },
      { status: 400 },
    );
  }

  const isFormSubmit =
    (request.headers.get("content-type") ?? "").includes("application/x-www-form-urlencoded") ||
    (request.headers.get("content-type") ?? "").includes("multipart/form-data");

  const response = isFormSubmit
    ? NextResponse.redirect(new URL("/", request.url))
    : NextResponse.json({
        ok: true,
        companyId,
      });

  response.cookies.set(APP_ACTIVE_COMPANY_COOKIE, companyId, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie,
    path: "/",
    maxAge: oneMonthInSeconds,
  });

  return response;
}
