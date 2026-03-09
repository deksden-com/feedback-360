import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  ResultsGetHrViewOutput,
  ResultsGetMyDashboardOutput,
  ResultsGetTeamDashboardOutput,
  ResultsOpenTextItem,
} from "@feedback-360/api-contract";
import {
  BarChart3,
  BookOpenText,
  CheckCircle2,
  Layers3,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

/**
 * Shared results report surfaces used by employee, manager, and HR dashboards.
 * @docs .memory-bank/spec/domain/results-visibility.md
 * @see .memory-bank/spec/ui/screens/employee-results-dashboard.md
 */
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
  accent = "default",
}: {
  label: string;
  value: string;
  description: string;
  testId?: string;
  accent?: "default" | "primary" | "success";
}) => {
  const accentClassName =
    accent === "primary"
      ? "border-primary/15 bg-primary/5"
      : accent === "success"
        ? "border-emerald-500/15 bg-emerald-500/5"
        : "border-border/70 bg-background/90";

  return (
    <div
      className={`rounded-[1.5rem] border p-4 shadow-sm ${accentClassName}`}
      data-testid={testId}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-sm leading-5 text-muted-foreground">{description}</p>
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
  resetHref = "/results",
}: {
  title: string;
  subtitle: string;
  testId?: string;
  children: ReactNode;
  resetHref?: string;
}) => {
  return (
    <div className="space-y-6" data-testid={testId}>
      <section
        className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_300px]"
        data-testid="results-layout-hero"
      >
        <Card className="overflow-hidden rounded-[2rem] border-0 bg-[#2563eb] text-white shadow-[0_20px_50px_-24px_rgba(37,99,235,0.9)]">
          <CardContent className="relative p-8 md:p-10">
            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="inline-flex items-center rounded-full bg-white/12 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-white/80">
                Results Workspace
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
                <p
                  className="max-w-xl text-sm leading-6 text-white/80 md:text-base"
                  data-testid="results-layout-context"
                >
                  {subtitle}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="rounded-xl bg-white px-5 text-primary shadow-none hover:bg-white/90"
                >
                  <a href={resetHref}>Сбросить фильтры</a>
                </Button>
                <span className="text-sm text-white/75">
                  Витрина уже учитывает privacy rules и role-based visibility.
                </span>
              </div>
            </div>
            <div className="absolute right-6 top-6 hidden h-36 w-36 rounded-[2rem] bg-white/10 lg:block" />
            <div className="absolute bottom-6 right-8 hidden h-24 w-24 rounded-[1.5rem] border border-white/10 bg-white/8 lg:block" />
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <KpiTile
            label="Фокус"
            value="Summary"
            description="Сначала общее чтение отчёта, затем переход к группам и компетенциям."
            testId="results-layout-focus"
            accent="primary"
          />
          <KpiTile
            label="Privacy"
            value="Applied"
            description="Порог анонимности, merge/hide и HR-only raw text уже применены."
            testId="results-layout-privacy"
            accent="success"
          />
          <KpiTile
            label="Mode"
            value="Report"
            description="Экран оформлен как report surface: контент выше фильтров и служебных действий."
            testId="results-layout-mode"
          />
        </div>
      </section>
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
    <Card
      className="overflow-hidden rounded-[2rem] border-border/70 shadow-sm"
      data-testid="results-summary"
    >
      <CardContent className="space-y-6 p-6 md:p-7">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.9fr)]">
          <div className="rounded-[1.75rem] bg-slate-950 px-6 py-6 text-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-white/75">
                  {viewerLabel ?? "Results overview"}
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold tracking-tight">Сводка результатов</h3>
                  <p className="max-w-2xl text-sm leading-6 text-white/75">
                    {modelKind === "levels"
                      ? "Для уровней интерфейс показывает mode и распределение. Числовой score нужен только для внутренних агрегаций."
                      : "Итог строится из агрегатов по компетенциям и effective weights групп."}
                  </p>
                </div>
              </div>
              <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm">
                <p className="text-white/60">Итоговый score</p>
                <p className="mt-2 text-3xl font-semibold" data-testid="results-overall-score">
                  {typeof overallScore === "number" ? overallScore.toFixed(2) : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[1.5rem] border border-border/70 bg-muted/15 px-4 py-4 text-sm">
              <div className="flex items-start gap-3">
                <Layers3 className="mt-0.5 size-4 text-primary" />
                <div className="space-y-1">
                  <p className="text-muted-foreground">Кампания</p>
                  <p className="font-medium">{renderLabel(campaignLabel, "Без названия")}</p>
                  <p className="font-mono text-xs text-muted-foreground">{campaignId}</p>
                </div>
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-muted/15 px-4 py-4 text-sm">
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 size-4 text-primary" />
                <div className="space-y-1">
                  <p className="text-muted-foreground">Сотрудник</p>
                  <p className="font-medium" data-testid="results-subject-label">
                    {renderLabel(subjectLabel, "Сотрудник кампании")}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">{subjectEmployeeId}</p>
                </div>
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-muted/15 px-4 py-4 text-sm">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 text-primary" />
                <div className="space-y-1">
                  <p className="text-muted-foreground">Методика</p>
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
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <KpiTile
            label="Итоговый балл"
            value={typeof overallScore === "number" ? overallScore.toFixed(2) : "—"}
            description="Финальный агрегат с учётом effective weights и правил видимости групп."
            accent="primary"
          />
          <KpiTile
            label="Текстовые инсайты"
            value={String(openTextCount ?? 0)}
            description="Количество доступных processed/summary блоков для текущей витрины."
            testId="results-open-text-count"
            accent="success"
          />
          <KpiTile
            label="Тип шкалы"
            value={modelKind === "levels" ? "Mode + dist" : "Средние"}
            description="Подача данных адаптирована к типу competency model."
            testId="results-model-kind"
          />
        </div>
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
    <Card className="rounded-[2rem] border-border/70 shadow-sm" data-testid="results-groups">
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl font-semibold tracking-tight">Группы оценивания</CardTitle>
        <CardDescription>
          Видимость каждой группы уже рассчитана по domain policy и показана без UI-догадок.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <div
            key={group.key}
            className="rounded-[1.5rem] border border-border/70 bg-background p-5 shadow-sm"
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
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Итог группы
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">
                  {renderOptionalScore(group.score)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Effective weight
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">
                  {renderPercentage(group.weight)}
                </p>
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
    <Card className="rounded-[2rem] border-border/70 shadow-sm" data-testid="results-competencies">
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl font-semibold tracking-tight">Компетенции</CardTitle>
        <CardDescription>
          Каждая карточка показывает агрегат по компетенции и то, как сработала visibility policy
          для групп оценивания.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.competencyScores.map((item) => (
          <div
            key={item.competencyId}
            className="rounded-[1.75rem] border border-border/70 bg-background p-5 text-sm shadow-sm"
            data-testid={`competency-row-${item.competencyId}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-lg font-semibold tracking-tight">
                  {item.competencyName} · {item.groupName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Пер-competency visibility уже учитывает NA/UNSURE и threshold policy.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/20 px-3 py-1 text-xs font-medium text-muted-foreground">
                <Target className="size-4" />
                competency aggregate
              </div>
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">Руководитель</p>
                  <VisibilityBadge visibility="shown" />
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-tight">
                  {renderOptionalScore(item.managerScore)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Валидных оценок: {item.managerRaters}
                </p>
              </div>

              <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">Самооценка</p>
                  <VisibilityBadge visibility="shown" />
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-tight">
                  {renderOptionalScore(item.selfScore)}
                </p>
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
                  <div
                    key={group.key}
                    className="rounded-[1.25rem] border border-border/70 bg-muted/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{group.label}</p>
                      <VisibilityBadge visibility={group.visibility} />
                    </div>
                    <p className="mt-3 text-2xl font-semibold tracking-tight">
                      {renderOptionalScore(group.score)}
                    </p>
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
    <Card className="rounded-[2rem] border-border/70 shadow-sm" data-testid="results-open-text">
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl font-semibold tracking-tight">Текстовые инсайты</CardTitle>
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
            accent="primary"
          />
          <KpiTile
            label="Processed"
            value={String(visibleItems.filter((item) => item.processedText).length)}
            description="Блоки, в которых есть AI-обработанный текст."
            accent="success"
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
                className="rounded-[1.5rem] border border-border/70 bg-background p-5 text-sm shadow-sm"
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
                  <div
                    className="mt-4 rounded-[1.25rem] border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950"
                    data-testid={`open-text-raw-${index}`}
                  >
                    <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                      <BookOpenText className="size-4" />
                      Raw
                    </div>
                    <p>{item.rawText}</p>
                  </div>
                ) : null}
                {textView !== "raw" && item.processedText ? (
                  <div
                    className="mt-4 rounded-[1.25rem] border border-primary/15 bg-primary/5 p-4 text-sm"
                    data-testid={`open-text-processed-${index}`}
                  >
                    <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                      <Sparkles className="size-4" />
                      Processed
                    </div>
                    <p>{item.processedText}</p>
                  </div>
                ) : null}
                {textView !== "raw" && item.summaryText ? (
                  <div
                    className="mt-4 rounded-[1.25rem] border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-950"
                    data-testid={`open-text-summary-${index}`}
                  >
                    <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                      <CheckCircle2 className="size-4" />
                      Summary
                    </div>
                    <p>{item.summaryText}</p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
