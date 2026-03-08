"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, LockKeyhole, Mail, MailCheck, ShieldCheck } from "lucide-react";
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
    <div className="auth-shell" data-testid="scr-auth-login-root">
      <header className="auth-topbar">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-6 py-4">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
            <MailCheck className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-950">go360go</h1>
            <p className="text-xs text-slate-500">Passwordless HR portal</p>
          </div>
        </div>
      </header>

      <main className="flex min-h-[calc(100dvh-73px)] items-center justify-center p-6">
        <div className="auth-card w-full max-w-[480px] p-8 sm:p-10">
          <div className="space-y-8" data-testid="scr-auth-login-form">
            <div className="space-y-3 text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <LockKeyhole className="size-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-slate-950">Вход в систему</h2>
                <p className="text-base leading-7 text-slate-500">
                  Введите рабочий email, и мы отправим безопасную magic link ссылку для доступа к
                  вашим оценкам и HR-процессам.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Рабочий email
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                  className="h-12 rounded-xl border-slate-200 bg-white pl-11 text-base shadow-none focus-visible:ring-primary/30"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Button
                className="h-12 w-full rounded-xl text-sm font-semibold shadow-sm"
                onClick={submitMagicLink}
                disabled={isSubmitting || email.trim().length === 0}
                data-testid="scr-auth-login-submit"
              >
                <span>{isSubmitting ? "Отправка..." : "Запросить magic link"}</span>
                <ArrowRight className="size-4" />
              </Button>

              {message ? <p className="text-center text-sm text-emerald-700">{message}</p> : null}
              {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}

              {isDevLike ? (
                <div
                  className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4"
                  data-testid="scr-auth-login-dev"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs leading-5 text-slate-500">
                        Dev helper: вход тестовым shared-user из seed `S1_multi_tenant_min`.
                      </p>
                      <Button
                        variant="secondary"
                        className="h-11 w-full rounded-xl bg-slate-200 text-slate-900 hover:bg-slate-300"
                        onClick={runDemoLogin}
                        disabled={isSubmitting}
                      >
                        Войти в demo-режиме
                      </Button>
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-xs leading-5 text-slate-500">
                          XE helper: вход по short-lived token из CLI (`Ctrl/Cmd+Shift+X`).
                        </p>
                        <button
                          type="button"
                          className="text-sm font-semibold text-slate-700 transition hover:text-primary"
                          onClick={() => setShowXeToken((current) => !current)}
                        >
                          {showXeToken ? "Скрыть" : "Показать"}
                        </button>
                      </div>

                      {showXeToken ? (
                        <div className="space-y-2">
                          <Label htmlFor="xe-token" className="text-sm font-medium text-slate-700">
                            XE token
                          </Label>
                          <Input
                            id="xe-token"
                            type="password"
                            autoComplete="off"
                            placeholder="xe1.…"
                            value={xeToken}
                            onChange={(event) => setXeToken(event.target.value)}
                            disabled={isSubmitting}
                            data-testid="scr-auth-login-xe-token"
                            className="h-11 rounded-xl border-slate-200 bg-white text-sm"
                          />
                          <Button
                            variant="secondary"
                            className="h-11 w-full rounded-xl bg-slate-200 text-slate-900 hover:bg-slate-300"
                            onClick={submitXeToken}
                            disabled={isSubmitting || xeToken.trim().length === 0}
                            data-testid="scr-auth-login-xe-submit"
                          >
                            {isSubmitting ? "Вход..." : "Войти по XE token"}
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="w-full text-left text-sm font-medium text-slate-500 transition hover:text-primary"
                          onClick={() => setShowXeToken(true)}
                        >
                          Login with developer token
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="w-full text-sm font-medium text-slate-500 transition hover:text-primary"
                >
                  Login with developer token
                </button>
              )}

              <div className="pt-1 text-center">
                <p className="inline-flex items-center gap-1 text-xs text-slate-400">
                  <ShieldCheck className="size-3.5" />
                  Secure, passwordless authentication
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="px-6 py-6 text-center text-sm text-slate-500">
        <div className="flex flex-wrap items-center justify-center gap-6">
          <button type="button" className="transition hover:text-primary">
            Privacy Policy
          </button>
          <button type="button" className="transition hover:text-primary">
            Terms of Service
          </button>
          <button type="button" className="transition hover:text-primary">
            Support
          </button>
        </div>
        <p className="mt-4 text-xs opacity-70">© 2026 go360go. All rights reserved.</p>
      </footer>
    </div>
  );
}
