import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const resolveSupabaseConfig = (): { url: string; anonKey: string } | undefined => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return undefined;
  }

  return { url, anonKey };
};

export async function POST(request: Request) {
  const payload = (await request.json()) as { email?: unknown };
  const email =
    typeof payload.email === "string" && payload.email.trim().length > 0
      ? payload.email.trim().toLowerCase()
      : undefined;

  if (!email) {
    return NextResponse.json(
      {
        ok: false,
        error: "email is required.",
      },
      { status: 400 },
    );
  }

  const config = resolveSupabaseConfig();
  if (!config) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Supabase auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      },
      { status: 503 },
    );
  }

  const supabase = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const redirectTo = `${new URL(request.url).origin}/auth/callback`;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    message:
      "Если email найден в системе, ссылка для входа отправлена. Проверьте почту и откройте ссылку.",
  });
}
