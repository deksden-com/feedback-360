import { APP_ACTIVE_COMPANY_COOKIE, APP_USER_ID_COOKIE } from "@/lib/app-session";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/auth/login", request.url));
  response.cookies.delete(APP_USER_ID_COOKIE);
  response.cookies.delete(APP_ACTIVE_COMPANY_COOKIE);
  return response;
}
