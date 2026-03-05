import { APP_ACTIVE_COMPANY_COOKIE, APP_USER_ID_COOKIE } from "@/lib/app-session";
import { NextResponse } from "next/server";

const oneMonthInSeconds = 60 * 60 * 24 * 30;
const shouldUseSecureCookie = process.env.APP_ENV === "prod";

export async function POST(request: Request) {
  let userId: string | undefined;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { userId?: unknown };
    if (typeof body.userId === "string" && body.userId.trim().length > 0) {
      userId = body.userId.trim();
    }
  } else {
    const formData = await request.formData();
    const formUserId = formData.get("userId");
    if (typeof formUserId === "string" && formUserId.trim().length > 0) {
      userId = formUserId.trim();
    }
  }

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
