import { InlineBanner } from "@/components/page-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCampaignDateTimeInput } from "@/lib/hr-campaigns";
import type { CampaignGetOutput, ModelVersionListItem } from "@feedback-360/api-contract";

type DraftFormValues = {
  campaignId?: string;
  name: string;
  modelVersionId: string;
  startAt: string;
  endAt: string;
  timezone: string;
  managerWeight: number;
  peersWeight: number;
  subordinatesWeight: number;
};

export const HrCampaignDraftForm = ({
  mode,
  values,
  models,
  returnTo,
  errorCode,
}: {
  mode: "create" | "edit";
  values: DraftFormValues;
  models: ModelVersionListItem[];
  returnTo: string;
  errorCode?: string;
}) => {
  const title = mode === "create" ? "Создать draft кампании" : "Редактировать draft кампании";
  const description =
    mode === "create"
      ? "Сначала создаём кампанию как draft, затем открываем detail dashboard для daily operations."
      : "Draft можно менять до запуска кампании: название, модель, даты, таймзону и веса.";

  const errorLabels: Record<string, string> = {
    invalid_input: "Не удалось сохранить draft. Проверьте заполнение полей и попробуйте снова.",
    campaign_started_immutable:
      "Кампания уже вышла из draft. Базовую конфигурацию больше нельзя редактировать.",
    not_found: "Не удалось найти кампанию или модель в активной компании.",
    forbidden: "Текущая роль не может сохранять campaign draft.",
  };

  return (
    <div className="space-y-4">
      {errorCode ? (
        <InlineBanner
          description={errorLabels[errorCode] ?? "Не удалось сохранить draft. Попробуйте снова."}
          tone="error"
          testId="campaign-draft-error"
        />
      ) : null}

      <Card className="rounded-[1.75rem] border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action="/api/hr/campaigns/draft"
            method="post"
            className="grid gap-6"
            data-testid="campaign-draft-form"
          >
            {values.campaignId ? (
              <input type="hidden" name="campaignId" value={values.campaignId} />
            ) : null}
            <input type="hidden" name="returnTo" value={returnTo} />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="campaignName">Название кампании</Label>
                <Input
                  id="campaignName"
                  name="name"
                  defaultValue={values.name}
                  data-testid="campaign-draft-name"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="campaignTimezone">Timezone</Label>
                <Input
                  id="campaignTimezone"
                  name="timezone"
                  defaultValue={values.timezone}
                  data-testid="campaign-draft-timezone"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="campaignModelVersionId">Модель компетенций</Label>
              <select
                id="campaignModelVersionId"
                name="modelVersionId"
                defaultValue={values.modelVersionId}
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                data-testid="campaign-draft-model"
              >
                {models.map((model) => (
                  <option key={model.modelVersionId} value={model.modelVersionId}>
                    {model.name} · v{model.version} · {model.kind}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="campaignStartAt">Start at</Label>
                <Input
                  id="campaignStartAt"
                  name="startAt"
                  type="datetime-local"
                  defaultValue={formatCampaignDateTimeInput(values.startAt)}
                  data-testid="campaign-draft-start-at"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="campaignEndAt">End at</Label>
                <Input
                  id="campaignEndAt"
                  name="endAt"
                  type="datetime-local"
                  defaultValue={formatCampaignDateTimeInput(values.endAt)}
                  data-testid="campaign-draft-end-at"
                />
              </div>
            </div>

            <Card className="rounded-[1.5rem] border-dashed border-border/70 bg-muted/10">
              <CardHeader>
                <CardTitle className="text-lg">Веса групп</CardTitle>
                <CardDescription>
                  Self остаётся `0%`; итог рассчитывается только по manager / peers / subordinates.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="managerWeight">Manager</Label>
                  <Input
                    id="managerWeight"
                    name="managerWeight"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={String(values.managerWeight)}
                    data-testid="campaign-draft-weight-manager"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="peersWeight">Peers</Label>
                  <Input
                    id="peersWeight"
                    name="peersWeight"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={String(values.peersWeight)}
                    data-testid="campaign-draft-weight-peers"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subordinatesWeight">Subordinates</Label>
                  <Input
                    id="subordinatesWeight"
                    name="subordinatesWeight"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={String(values.subordinatesWeight)}
                    data-testid="campaign-draft-weight-subordinates"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.5rem] border-dashed border-border/70 bg-muted/10">
              <CardHeader>
                <CardTitle className="text-lg">Notification policy</CardTitle>
                <CardDescription>
                  В текущем слайсе мы фиксируем базовый draft кампании. Детальная настройка reminder
                  schedules и template catalog идёт отдельным GUI-эпиком notification center.
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" data-testid="campaign-draft-save">
                {mode === "create" ? "Создать draft" : "Сохранить draft"}
              </Button>
              <Button asChild variant="outline">
                <a
                  href={mode === "create" ? "/hr/campaigns" : `/hr/campaigns/${values.campaignId}`}
                >
                  Отмена
                </a>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export const getDraftFormValues = (campaign?: CampaignGetOutput): DraftFormValues => {
  if (!campaign) {
    return {
      name: "HR campaign",
      modelVersionId: "",
      startAt: "2026-01-15T09:00:00.000Z",
      endAt: "2026-01-30T18:00:00.000Z",
      timezone: "Europe/Kaliningrad",
      managerWeight: 40,
      peersWeight: 30,
      subordinatesWeight: 30,
    };
  }

  return {
    campaignId: campaign.campaignId,
    name: campaign.name,
    modelVersionId: campaign.modelVersionId ?? "",
    startAt: campaign.startAt,
    endAt: campaign.endAt,
    timezone: campaign.timezone,
    managerWeight: campaign.managerWeight,
    peersWeight: campaign.peersWeight,
    subordinatesWeight: campaign.subordinatesWeight,
  };
};
