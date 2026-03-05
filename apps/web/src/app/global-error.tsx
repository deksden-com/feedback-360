"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ru">
      <body className="bg-background text-foreground">
        <main className="mx-auto flex min-h-dvh w-full max-w-2xl items-center justify-center p-6">
          <div className="w-full space-y-3 rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h1 className="text-2xl font-semibold tracking-tight">Что-то пошло не так</h1>
            <p className="text-sm text-muted-foreground">
              Мы уже записали ошибку. Попробуйте обновить страницу или вернуться позже.
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}
