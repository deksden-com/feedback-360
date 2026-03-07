"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const isDevLike = process.env.NEXT_PUBLIC_APP_ENV !== "prod";

/**
 * Login screen.
 * @screenId SCR-AUTH-LOGIN
 * @testIdScope scr-auth-login
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [xeToken, setXeToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showXeToken, setShowXeToken] = useState(false);
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

  const submitXeToken = async () => {
    setError(undefined);
    setMessage(undefined);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/dev/xe-token-login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ token: xeToken }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        actor?: string;
        runId?: string;
      };
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Не удалось выполнить XE-вход.");
        return;
      }

      setMessage(`XE-вход выполнен: ${payload.actor ?? "actor"} (${payload.runId ?? "run"}).`);
      router.push("/");
    } catch {
      setError("Не удалось выполнить XE-вход.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isDevLike) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "x") {
        event.preventDefault();
        setShowXeToken((current) => !current);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <main
      className="mx-auto flex min-h-dvh w-full max-w-lg items-center p-6"
      data-testid="scr-auth-login-root"
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Вход в систему</CardTitle>
          <CardDescription>
            Введите рабочий email. Если он есть в HR-справочнике, отправим magic link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4" data-testid="scr-auth-login-form">
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
            data-testid="scr-auth-login-submit"
          >
            {isSubmitting ? "Отправка..." : "Отправить ссылку"}
          </Button>
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {isDevLike ? (
            <div className="rounded-md border border-dashed p-3" data-testid="scr-auth-login-dev">
              <div className="space-y-3">
                <div>
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

                <div className="border-t pt-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      XE helper: вход по short-lived token из CLI (`Ctrl/Cmd+Shift+X`).
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => setShowXeToken((current) => !current)}
                    >
                      {showXeToken ? "Скрыть" : "Показать"}
                    </Button>
                  </div>

                  {showXeToken ? (
                    <div className="space-y-2">
                      <Label htmlFor="xe-token">XE token</Label>
                      <Input
                        id="xe-token"
                        type="password"
                        autoComplete="off"
                        placeholder="xe1.…"
                        value={xeToken}
                        onChange={(event) => setXeToken(event.target.value)}
                        disabled={isSubmitting}
                        data-testid="scr-auth-login-xe-token"
                      />
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={submitXeToken}
                        disabled={isSubmitting || xeToken.trim().length === 0}
                        data-testid="scr-auth-login-xe-submit"
                      >
                        {isSubmitting ? "Вход..." : "Войти по XE token"}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
