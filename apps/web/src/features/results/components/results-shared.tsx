import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  ResultsGetHrViewOutput,
  ResultsGetMyDashboardOutput,
  ResultsGetTeamDashboardOutput,
  ResultsOpenTextItem,
} from "@feedback-360/api-contract";
import type { ReactNode } from "react";

const groupLabels: Record<string, string> = {
  manager: "Руководитель",
  peers: "Коллеги",
  subordinates: "Подчинённые",
  self: "Самооценка",
  other: "Другие",
};

const visibilityLabels: Record<string, string> = {
  shown: "Показываем",
  hidden: "Скрыто",
  merged: "Объединено",
};

const visibilityToneClasses: Record<string, string> = {
  shown: "border-emerald-200 bg-emerald-50 text-emerald-900",
  hidden: "border-amber-200 bg-amber-50 text-amber-900",
  merged: "border-sky-200 bg-sky-50 text-sky-900",
};

const renderOptionalScore = (score: number | undefined): string => {
  if (typeof score !== "number") {
    return "—";
  }
  return score.toFixed(2);
};

const renderVisibility = (visibility: string | undefined): string => {
  if (!visibility) {
    return "—";
  }
  return visibilityLabels[visibility] ?? visibility;
};

const renderPercentage = (value: number | undefined): string => {
  if (typeof value !== "number") {
    return "—";
  }

  return `${Math.round(value)}%`;
};

const renderLabel = (label: string | undefined, fallback: string): string => {
  if (!label || label.trim().length === 0) {
    return fallback;
  }

  return label.trim();
};

const getVisibilitySummary = (group: string, visibility: string | undefined, threshold: number) => {
  if (group === "manager") {
    return "Оценка руководителя всегда показывается персонально.";
  }

  if (group === "self") {
    return "Самооценка видна для gap analysis и не влияет на итоговый балл.";
  }

  if (visibility === "shown") {
    return `Группа проходит порог анонимности ${threshold} и включена в агрегат.`;
  }

  if (visibility === "merged") {
    return `Группа объединена в «Другие», чтобы сохранить анонимность при пороге ${threshold}.`;
  }

  if (visibility === "hidden") {
    return `Группа скрыта, потому что не набрала порог анонимности ${threshold}.`;
  }

  return "Состояние группы определяется по правилам кампании.";
};

const getCompetencyVisibilitySummary = (
  label: string,
  visibility: string | undefined,
  raters: number | undefined,
) => {
  if (label === "Руководитель" || label === "Самооценка") {
    return null;
  }

  if (visibility === "shown") {
    return `${label}: ${raters ?? 0} валидных ответов, строка раскрыта в отчёте.`;
  }

  if (visibility === "merged") {
    return `${label}: данные объединены в «Другие» для безопасного показа.`;
  }

  if (visibility === "hidden") {
    return `${label}: недостаточно валидных ответов, поэтому строка скрыта.`;
  }

  return null;
};

const getOpenTextHeadline = (items: ResultsOpenTextItem[]): string => {
  const processedCount = items.filter((item) => item.processedText).length;
  const summaryCount = items.filter((item) => item.summaryText).length;

  if (processedCount === 0 && summaryCount === 0) {
    return "AI-обработанные текстовые инсайты пока недоступны.";
  }

  if (processedCount > 0 && summaryCount > 0) {
    return "Обработанные комментарии и summary собраны по группам и компетенциям.";
  }

  if (processedCount > 0) {
    return "Доступны обработанные комментарии по группам и компетенциям.";
  }

  return "Доступны summary-блоки без raw-комментариев.";
};

const KpiTile = ({
  label,
  value,
  description,
  testId,
}: {
  label: string;
  value: string;
  description: string;
  testId?: string;
}) => {
  return (
    <div className="rounded-lg border bg-background/90 p-4" data-testid={testId}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{description}</p>
    </div>
  );
};

const VisibilityBadge = ({ visibility }: { visibility: string | undefined }) => {
  const label = renderVisibility(visibility);
  const className =
    visibilityToneClasses[visibility ?? ""] ?? "border-border bg-muted text-foreground";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
};

export const ResultsPageLayout = ({
  title,
  subtitle,
  testId,
  children,
}: {
  title: string;
  subtitle: string;
  testId?: string;
  children: ReactNode;
}) => {
  return (
    <div className="space-y-5" data-testid={testId}>
      <Card
        className="overflow-hidden border-border/80 shadow-sm"
        data-testid="results-layout-hero"
      >
        <CardHeader className="gap-4 border-b bg-muted/25">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{title}</CardTitle>
              <CardDescription className="max-w-3xl" data-testid="results-layout-context">
                {subtitle}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <a href="/results">Сбросить фильтры</a>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      {children}
    </div>
  );
};

export const ResultsSummaryCard = ({
  campaignId,
  subjectEmployeeId,
  campaignLabel,
  subjectLabel,
  overallScore,
  modelKind,
  anonymityThreshold,
  openTextCount,
  viewerLabel,
}: {
  campaignId: string;
  subjectEmployeeId: string;
  campaignLabel?: string;
  subjectLabel?: string;
  overallScore: number | undefined;
  modelKind: "indicators" | "levels";
  anonymityThreshold?: number;
  openTextCount?: number;
  viewerLabel?: string;
}) => {
  return (
    <Card className="overflow-hidden border-border/80 shadow-sm" data-testid="results-summary">
      <CardHeader className="gap-4 border-b bg-muted/35">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-xl">Сводка результатов</CardTitle>
            <CardDescription className="max-w-2xl">
              {viewerLabel ?? "Итоги завершённой кампании"} ·{" "}
              {modelKind === "levels"
                ? "UI акцентирует mode и распределение, числовой score нужен только для агрегации."
                : "Итог строится из агрегатов по компетенциям и весам групп."}
            </CardDescription>
          </div>
          <div className="rounded-lg border bg-background px-4 py-3 text-sm">
            <p className="text-muted-foreground">Кампания</p>
            <p className="font-medium">{renderLabel(campaignLabel, "Без названия")}</p>
            <p className="font-mono text-xs text-muted-foreground">{campaignId}</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border bg-background px-4 py-3 text-sm">
            <p className="text-muted-foreground">Сотрудник</p>
            <p className="font-medium" data-testid="results-subject-label">
              {renderLabel(subjectLabel, "Сотрудник кампании")}
            </p>
            <p className="font-mono text-xs text-muted-foreground">{subjectEmployeeId}</p>
          </div>
          <div className="rounded-lg border bg-background px-4 py-3 text-sm">
            <p className="text-muted-foreground">Модель оценки</p>
            <p className="font-medium">
              {modelKind === "levels" ? "Уровни 1–4" : "Индикаторы 1–5"}
            </p>
            {typeof anonymityThreshold === "number" ? (
              <p className="text-xs text-muted-foreground">
                Порог анонимности: {anonymityThreshold}
              </p>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 pt-6 md:grid-cols-3">
        <KpiTile
          label="Итоговый балл"
          value={typeof overallScore === "number" ? overallScore.toFixed(2) : "—"}
          description="Финальный агрегат с учётом effective weights и правил видимости групп."
          testId="results-overall-score"
        />
        <KpiTile
          label="Текстовые инсайты"
          value={String(openTextCount ?? 0)}
          description="Количество доступных processed/summary блоков для текущей витрины."
          testId="results-open-text-count"
        />
        <KpiTile
          label="Тип шкалы"
          value={modelKind === "levels" ? "Mode + dist" : "Средние"}
          description="Подача данных адаптирована к типу competency model."
          testId="results-model-kind"
        />
      </CardContent>
    </Card>
  );
};

export const ResultsGroupCard = ({
  data,
}: {
  data: ResultsGetMyDashboardOutput | ResultsGetTeamDashboardOutput | ResultsGetHrViewOutput;
}) => {
  const groups = [
    {
      key: "manager",
      label: groupLabels.manager,
      visibility: data.groupVisibility.manager,
      score: data.groupOverall.manager,
      weight: data.effectiveGroupWeights.manager,
    },
    {
      key: "peers",
      label: groupLabels.peers,
      visibility: data.groupVisibility.peers,
      score: data.groupOverall.peers,
      weight: data.effectiveGroupWeights.peers,
    },
    {
      key: "subordinates",
      label: groupLabels.subordinates,
      visibility: data.groupVisibility.subordinates,
      score: data.groupOverall.subordinates,
      weight: data.effectiveGroupWeights.subordinates,
    },
    {
      key: "self",
      label: groupLabels.self,
      visibility: data.groupVisibility.self,
      score: data.groupOverall.self,
      weight: data.effectiveGroupWeights.self,
    },
    {
      key: "other",
      label: groupLabels.other,
      visibility: data.groupVisibility.other,
      score: data.groupOverall.other,
      weight: data.effectiveGroupWeights.other,
    },
  ].filter((group) => group.visibility !== undefined || group.score !== undefined || group.weight);

  return (
    <Card className="border-border/80 shadow-sm" data-testid="results-groups">
      <CardHeader>
        <CardTitle className="text-xl">Группы оценивания</CardTitle>
        <CardDescription>
          Видимость каждой группы уже рассчитана по domain policy и показана без UI-догадок.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <div
            key={group.key}
            className="rounded-lg border bg-background p-4"
            data-testid={`results-group-card-${group.key}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="font-medium">{group.label}</p>
                <p className="text-xs text-muted-foreground">
                  {getVisibilitySummary(group.key, group.visibility, data.anonymityThreshold)}
                </p>
              </div>
              <VisibilityBadge visibility={group.visibility} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Итог группы</p>
                <p className="text-lg font-semibold">{renderOptionalScore(group.score)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Effective weight</p>
                <p className="text-lg font-semibold">{renderPercentage(group.weight)}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export const ResultsCompetenciesCard = ({
  data,
}: {
  data: ResultsGetMyDashboardOutput | ResultsGetTeamDashboardOutput | ResultsGetHrViewOutput;
}) => {
  return (
    <Card className="border-border/80 shadow-sm" data-testid="results-competencies">
      <CardHeader>
        <CardTitle className="text-xl">Компетенции</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.competencyScores.map((item) => (
          <div
            key={item.competencyId}
            className="rounded-xl border bg-background p-4 text-sm"
            data-testid={`competency-row-${item.competencyId}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {item.competencyName} · {item.groupName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Пер-competency visibility уже учитывает NA/UNSURE и threshold policy.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">Руководитель</p>
                  <VisibilityBadge visibility="shown" />
                </div>
                <p className="mt-2 text-lg font-semibold">
                  {renderOptionalScore(item.managerScore)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Валидных оценок: {item.managerRaters}
                </p>
              </div>

              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">Самооценка</p>
                  <VisibilityBadge visibility="shown" />
                </div>
                <p className="mt-2 text-lg font-semibold">{renderOptionalScore(item.selfScore)}</p>
                <p className="text-xs text-muted-foreground">Валидных оценок: {item.selfRaters}</p>
              </div>

              {[
                {
                  key: "peers",
                  label: groupLabels.peers,
                  score: item.peersScore,
                  raters: item.peersRaters,
                  visibility: item.peersVisibility,
                },
                {
                  key: "subordinates",
                  label: groupLabels.subordinates,
                  score: item.subordinatesScore,
                  raters: item.subordinatesRaters,
                  visibility: item.subordinatesVisibility,
                },
                ...(item.otherVisibility
                  ? [
                      {
                        key: "other",
                        label: groupLabels.other,
                        score: item.otherScore,
                        raters: item.otherRaters,
                        visibility: item.otherVisibility,
                      },
                    ]
                  : []),
              ].map((group) => {
                const summary = getCompetencyVisibilitySummary(
                  group.label ?? group.key,
                  group.visibility,
                  group.raters,
                );

                return (
                  <div key={group.key} className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{group.label}</p>
                      <VisibilityBadge visibility={group.visibility} />
                    </div>
                    <p className="mt-2 text-lg font-semibold">{renderOptionalScore(group.score)}</p>
                    <p className="text-xs text-muted-foreground">Валидных оценок: {group.raters}</p>
                    {summary ? (
                      <p className="mt-2 text-xs text-muted-foreground">{summary}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export const ResultsOpenTextCard = ({
  items,
  showRawText,
  textView = "combined",
}: {
  items: ResultsOpenTextItem[] | undefined;
  showRawText: boolean;
  textView?: "combined" | "processed" | "raw";
}) => {
  const openText = items ?? [];
  const visibleItems = openText.filter((item) => {
    if (textView === "raw") {
      return showRawText && Boolean(item.rawText);
    }

    if (textView === "processed") {
      return Boolean(item.processedText || item.summaryText);
    }

    return showRawText
      ? Boolean(item.rawText || item.processedText || item.summaryText)
      : Boolean(item.processedText || item.summaryText);
  });

  return (
    <Card className="border-border/80 shadow-sm" data-testid="results-open-text">
      <CardHeader>
        <CardTitle className="text-xl">Текстовые инсайты</CardTitle>
        <CardDescription>
          {showRawText
            ? "HR видит оригинальные и обработанные комментарии, но может сузить витрину до нужного представления."
            : "Сотрудник и руководитель видят только processed/summary без raw текста."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <KpiTile
            label="Записей"
            value={String(visibleItems.length)}
            description="Количество отображаемых текстовых блоков в текущем режиме."
            testId="results-open-text-visible-count"
          />
          <KpiTile
            label="Processed"
            value={String(visibleItems.filter((item) => item.processedText).length)}
            description="Блоки, в которых есть AI-обработанный текст."
          />
          <KpiTile
            label="Summary"
            value={String(visibleItems.filter((item) => item.summaryText).length)}
            description="Блоки, в которых есть итоговое summary."
          />
        </div>
        <p className="mb-4 text-sm text-muted-foreground" data-testid="results-open-text-headline">
          {getOpenTextHeadline(visibleItems)}
        </p>
        {visibleItems.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="results-open-text-empty">
            Нет комментариев для отображения.
          </p>
        ) : (
          <div className="space-y-3">
            {visibleItems.map((item, index) => (
              <div
                key={`${item.competencyId}:${item.group}:${index}`}
                className="rounded-xl border bg-background p-4 text-sm"
                data-testid={`open-text-item-${index}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {groupLabels[item.group] ?? item.group} · competency{" "}
                      <span className="font-mono text-xs">{item.competencyId}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Источник: {item.count} текстовых ответов после применения privacy policy.
                    </p>
                  </div>
                  <div className="rounded-full border bg-muted px-2.5 py-1 text-xs font-medium">
                    count {item.count}
                  </div>
                </div>
                {showRawText && textView !== "processed" && item.rawText ? (
                  <p data-testid={`open-text-raw-${index}`}>Raw: {item.rawText}</p>
                ) : null}
                {textView !== "raw" && item.processedText ? (
                  <p data-testid={`open-text-processed-${index}`}>
                    Processed: {item.processedText}
                  </p>
                ) : null}
                {textView !== "raw" && item.summaryText ? (
                  <p data-testid={`open-text-summary-${index}`}>Summary: {item.summaryText}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
