import { NextResponse } from "next/server";

import { verifyXeLoginToken } from "@/features/xe-auth/lib/token";
import { APP_ACTIVE_COMPANY_COOKIE, APP_USER_ID_COOKIE } from "@/lib/app-session";

const isDevLike = process.env.APP_ENV !== "prod";
const oneMonthInSeconds = 60 * 60 * 24 * 30;
const shouldUseSecureCookie = process.env.APP_ENV === "prod";

const readToken = async (request: Request): Promise<string | undefined> => {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { token?: unknown };
    if (typeof body.token === "string" && body.token.trim().length > 0) {
      return body.token.trim();
    }
    return undefined;
  }

  const formData = await request.formData();
  const token = formData.get("token");
  if (typeof token === "string" && token.trim().length > 0) {
    return token.trim();
  }

  return undefined;
};

export async function POST(request: Request) {
  if (!isDevLike) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const token = await readToken(request);
  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        error: "token is required.",
      },
      { status: 400 },
    );
  }

  try {
    const payload = verifyXeLoginToken(token);
    const response = NextResponse.json({
      ok: true,
      runId: payload.runId,
      actor: payload.actor,
      userId: payload.userId,
      companyId: payload.companyId,
    });

    response.cookies.set(APP_USER_ID_COOKIE, payload.userId, {
      httpOnly: true,
      sameSite: "lax",
      secure: shouldUseSecureCookie,
      path: "/",
      maxAge: oneMonthInSeconds,
    });
    response.cookies.set(APP_ACTIVE_COMPANY_COOKIE, payload.companyId, {
      httpOnly: true,
      sameSite: "lax",
      secure: shouldUseSecureCookie,
      path: "/",
      maxAge: oneMonthInSeconds,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "XE token login failed.";
    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 400 },
    );
  }
}
