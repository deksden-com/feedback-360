"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";

const isDevLike = process.env.NEXT_PUBLIC_APP_ENV !== "prod";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  const submitMagicLink = async () => {
    setError(undefined);
    setMessage(undefined);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string; error?: string };
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Не удалось отправить ссылку.");
        return;
      }

      setMessage(payload.message ?? "Проверьте почту: ссылка отправлена.");
    } catch {
      setError("Ошибка сети при отправке ссылки.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const runDemoLogin = async () => {
    setError(undefined);
    setMessage(undefined);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/dev/seed", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          scenario: "S1_multi_tenant_min",
        }),
      });
      const seeded = (await response.json()) as {
        ok?: boolean;
        handles?: Record<string, string>;
      };
      if (!response.ok || !seeded.ok || !seeded.handles?.["user.shared"]) {
        setError("Не удалось подготовить demo-данные.");
        return;
      }

      const loginResponse = await fetch("/api/dev/test-login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          userId: seeded.handles["user.shared"],
        }),
      });
      const loginPayload = (await loginResponse.json()) as { ok?: boolean };
      if (!loginResponse.ok || !loginPayload.ok) {
        setError("Не удалось выполнить demo-вход.");
        return;
      }

      router.push("/select-company");
    } catch {
      setError("Не удалось выполнить demo-вход.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg items-center p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Вход в систему</CardTitle>
          <CardDescription>
            Введите рабочий email. Если он есть в HR-справочнике, отправим magic link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Рабочий email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <Button
            className="w-full"
            onClick={submitMagicLink}
            disabled={isSubmitting || email.trim().length === 0}
          >
            {isSubmitting ? "Отправка..." : "Отправить ссылку"}
          </Button>
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {isDevLike ? (
            <div className="rounded-md border border-dashed p-3">
              <p className="mb-2 text-xs text-muted-foreground">
                Dev helper: вход тестовым shared-user (seed `S1_multi_tenant_min`).
              </p>
              <Button
                variant="secondary"
                className="w-full"
                onClick={runDemoLogin}
                disabled={isSubmitting}
              >
                Войти в demo-режиме
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
