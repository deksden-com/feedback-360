import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * Shared page-state surfaces for loading, empty, error, and inline feedback.
 * @docs .memory-bank/spec/ui/design-system/component-usage.md
 * @see .memory-bank/spec/testing/ui-automation-contract.md
 */
type PageStateAction = {
  href: string;
  label: string;
  variant?: "default" | "outline";
  testId?: string;
};

type PageStateCardProps = {
  title: string;
  description: string;
  actions?: PageStateAction[];
  children?: ReactNode;
  testId?: string;
  tone?: "default" | "error" | "warning";
  compact?: boolean;
};

const toneClasses: Record<NonNullable<PageStateCardProps["tone"]>, string> = {
  default: "border-border bg-background",
  error: "border-destructive/30 bg-destructive/5",
  warning: "border-amber-300 bg-amber-50",
};

export const PageStateCard = ({
  title,
  description,
  actions,
  children,
  testId,
  tone = "default",
  compact = false,
}: PageStateCardProps) => {
  return (
    <Card className={cn("w-full", toneClasses[tone])} data-testid={testId}>
      <CardHeader className={cn(compact ? "pb-3" : "pb-4", "space-y-2")}>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-sm leading-6">{description}</CardDescription>
      </CardHeader>
      {children ? <CardContent className="space-y-4">{children}</CardContent> : null}
      {actions && actions.length > 0 ? (
        <CardContent className={cn("flex flex-wrap gap-2", children ? "pt-0" : "")}>
          {actions.map((action) => (
            <Button
              asChild
              key={`${action.href}:${action.label}`}
              variant={action.variant ?? "default"}
            >
              <a href={action.href} data-testid={action.testId}>
                {action.label}
              </a>
            </Button>
          ))}
        </CardContent>
      ) : null}
    </Card>
  );
};

export const PageStateScreen = ({
  children,
  maxWidthClassName = "max-w-3xl",
}: {
  children: ReactNode;
  maxWidthClassName?: string;
}) => {
  return (
    <main className={cn("mx-auto flex min-h-dvh w-full items-center p-6", maxWidthClassName)}>
      {children}
    </main>
  );
};

export const PageErrorState = (
  props: Omit<PageStateCardProps, "tone" | "testId"> & { testId?: string },
) => <PageStateCard {...props} tone="error" testId={props.testId ?? "page-error-state"} />;

export const PageEmptyState = (
  props: Omit<PageStateCardProps, "tone" | "testId"> & { testId?: string },
) => <PageStateCard {...props} tone="default" testId={props.testId ?? "page-empty-state"} />;

export const PageLoadingState = ({
  title = "Загружаем данные",
  description = "Подготавливаем экран и проверяем активный контекст компании.",
  testId = "page-loading-state",
}: {
  title?: string;
  description?: string;
  testId?: string;
}) => {
  return (
    <PageStateScreen>
      <Card className="w-full" data-testid={testId}>
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-sm leading-6">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-20 animate-pulse rounded bg-muted/70" />
          <div className="grid gap-3 md:grid-cols-2">
            <div className="h-24 animate-pulse rounded bg-muted/70" />
            <div className="h-24 animate-pulse rounded bg-muted/70" />
          </div>
        </CardContent>
      </Card>
    </PageStateScreen>
  );
};

export const InlineBanner = ({
  title,
  description,
  tone = "default",
  testId,
}: {
  title?: string;
  description: string;
  tone?: "default" | "error" | "warning" | "success";
  testId?: string;
}) => {
  const classes =
    tone === "error"
      ? "border-destructive/40 bg-destructive/5 text-destructive"
      : tone === "warning"
        ? "border-amber-300 bg-amber-50 text-amber-950"
        : tone === "success"
          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
          : "border-border bg-muted/20 text-foreground";

  return (
    <div className={cn("rounded-md border px-4 py-3 text-sm", classes)} data-testid={testId}>
      {title ? <p className="font-medium">{title}</p> : null}
      <p>{description}</p>
    </div>
  );
};
