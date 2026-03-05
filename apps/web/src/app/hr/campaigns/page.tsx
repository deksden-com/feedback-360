import { Button } from "@/components/ui/button";
import { resolveAppOperationContext } from "@/lib/operation-context";
import { redirect } from "next/navigation";

import { HrCampaignWorkbench } from "./_workbench";

const getQueryValue = (value: string | string[] | undefined): string | undefined => {
  if (typeof value === "string") {
    return value.trim().length > 0 ? value.trim() : undefined;
  }
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0] ?? "";
    return first.trim().length > 0 ? first.trim() : undefined;
  }
  return undefined;
};

export default async function HrCampaignsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await resolveAppOperationContext();
  if (!resolved.ok) {
    if (resolved.error.code === "unauthenticated") {
      redirect("/auth/login");
    }
    if (resolved.error.code === "active_company_required") {
      redirect("/select-company");
    }
  }

  if (!resolved.ok) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-3xl items-center p-6">
        <div className="rounded-md border p-6 text-sm text-destructive">
          {resolved.error.message}
        </div>
      </main>
    );
  }

  const isHrRole = resolved.context.role === "hr_admin" || resolved.context.role === "hr_reader";
  if (!isHrRole) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-3xl items-center p-6">
        <div className="w-full space-y-3 rounded-md border p-6">
          <h1 className="text-2xl font-semibold">HR Campaign Workbench</h1>
          <p className="text-sm text-destructive">
            Доступно только для ролей HR Admin и HR Reader.
          </p>
          <Button asChild variant="outline">
            <a href="/">На главную</a>
          </Button>
        </div>
      </main>
    );
  }

  const params = searchParams ? await searchParams : undefined;
  const initialCampaignId = getQueryValue(params?.campaignId);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl p-6">
      <div className="w-full space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">HR Campaign Workbench</h1>
          <p className="text-muted-foreground">
            Draft/start/matrix/progress/retry AI через typed client API.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href="/">На главную</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/results/hr">HR результаты</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/select-company">Сменить компанию</a>
          </Button>
        </div>
        <HrCampaignWorkbench role={resolved.context.role} initialCampaignId={initialCampaignId} />
      </div>
    </main>
  );
}
