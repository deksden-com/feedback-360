import { APP_ACTIVE_COMPANY_COOKIE, APP_USER_ID_COOKIE } from "@/lib/app-session";
import { NextResponse } from "next/server";

const isDevLike = process.env.APP_ENV !== "prod";
const oneMonthInSeconds = 60 * 60 * 24 * 30;
const shouldUseSecureCookie = process.env.APP_ENV === "prod";

export async function POST(request: Request) {
  if (!isDevLike) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const payload = (await request.json()) as { userId?: unknown };
  const userId =
    typeof payload.userId === "string" && payload.userId.trim().length > 0
      ? payload.userId.trim()
      : undefined;

  if (!userId) {
    return NextResponse.json(
      {
        ok: false,
        error: "userId is required.",
      },
      { status: 400 },
    );
  }

  const response = NextResponse.json({
    ok: true,
    userId,
  });

  response.cookies.set(APP_USER_ID_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie,
    path: "/",
    maxAge: oneMonthInSeconds,
  });
  response.cookies.delete(APP_ACTIVE_COMPANY_COOKIE);

  return response;
}
