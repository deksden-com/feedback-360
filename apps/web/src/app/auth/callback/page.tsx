"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const syncSessionToApp = async (userId: string) => {
  const response = await fetch("/api/session/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });
  const payload = (await response.json()) as { ok?: boolean };
  return response.ok && Boolean(payload.ok);
};

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"processing" | "ready" | "error">("processing");
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const syncCurrentUser = async () => {
          const { data } = await supabase.auth.getUser();
          const userId = data.user?.id;
          if (!userId) {
            return false;
          }
          return syncSessionToApp(userId);
        };

        if (await syncCurrentUser()) {
          if (!cancelled) {
            setStatus("ready");
            router.replace("/select-company");
          }
          return;
        }

        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
          const userId = session?.user?.id;
          if (!userId || cancelled) {
            return;
          }

          const synced = await syncSessionToApp(userId);
          if (synced && !cancelled) {
            setStatus("ready");
            router.replace("/select-company");
          }
        });

        setTimeout(() => {
          if (!cancelled) {
            setStatus("error");
            setError("Не удалось завершить вход автоматически. Попробуйте снова.");
          }
          listener.subscription.unsubscribe();
        }, 3500);
      } catch {
        if (!cancelled) {
          setStatus("error");
          setError("Ошибка обработки callback.");
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg items-center p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Проверяем вход</CardTitle>
          <CardDescription>
            Завершаем вход по magic link и подготавливаем выбор активной компании.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "processing" ? (
            <p className="text-sm text-muted-foreground">Пожалуйста, подождите...</p>
          ) : null}
          {status === "error" ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button variant="secondary" className="w-full" onClick={() => router.push("/auth/login")}>
            Вернуться к входу
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
