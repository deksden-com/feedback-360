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

export const ResultsPageLayout = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) => {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl p-6">
      <div className="w-full space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href="/">На главную</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/questionnaires">Мои анкеты</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/results">Мои результаты</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/results/team">Результаты команды</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/results/hr">HR результаты</a>
          </Button>
        </div>
        {children}
      </div>
    </main>
  );
};

export const ResultsSummaryCard = ({
  campaignId,
  subjectEmployeeId,
  overallScore,
  modelKind,
}: {
  campaignId: string;
  subjectEmployeeId: string;
  overallScore: number | undefined;
  modelKind: "indicators" | "levels";
}) => {
  return (
    <Card data-testid="results-summary">
      <CardHeader>
        <CardTitle className="text-xl">Сводка</CardTitle>
        <CardDescription>
          Campaign: <span className="font-mono text-xs">{campaignId}</span> · Subject:{" "}
          <span className="font-mono text-xs">{subjectEmployeeId}</span> · Модель: {modelKind}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <p data-testid="results-overall-score">
          Итоговый балл: {typeof overallScore === "number" ? overallScore.toFixed(2) : "—"}
        </p>
      </CardContent>
    </Card>
  );
};

export const ResultsGroupCard = ({
  data,
}: {
  data: ResultsGetMyDashboardOutput | ResultsGetTeamDashboardOutput | ResultsGetHrViewOutput;
}) => {
  return (
    <Card data-testid="results-groups">
      <CardHeader>
        <CardTitle className="text-xl">Группы оценивания</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          Видимость: руководитель — {renderVisibility(data.groupVisibility.manager)}, коллеги —{" "}
          {renderVisibility(data.groupVisibility.peers)}, подчинённые —{" "}
          {renderVisibility(data.groupVisibility.subordinates)}, самооценка —{" "}
          {renderVisibility(data.groupVisibility.self)}, другие —{" "}
          {renderVisibility(data.groupVisibility.other)}
        </p>
        <p>
          Итоги по группам: руководитель {renderOptionalScore(data.groupOverall.manager)}, коллеги{" "}
          {renderOptionalScore(data.groupOverall.peers)}, подчинённые{" "}
          {renderOptionalScore(data.groupOverall.subordinates)}, самооценка{" "}
          {renderOptionalScore(data.groupOverall.self)}, другие{" "}
          {renderOptionalScore(data.groupOverall.other)}
        </p>
        <p>
          Effective weights: руководитель {data.effectiveGroupWeights.manager}%, коллеги{" "}
          {data.effectiveGroupWeights.peers}%, подчинённые {data.effectiveGroupWeights.subordinates}
          %, самооценка {data.effectiveGroupWeights.self}%, другие{" "}
          {data.effectiveGroupWeights.other}
          %.
        </p>
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
    <Card data-testid="results-competencies">
      <CardHeader>
        <CardTitle className="text-xl">Компетенции</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.competencyScores.map((item) => (
          <div
            key={item.competencyId}
            className="rounded-md border p-3 text-sm"
            data-testid={`competency-row-${item.competencyId}`}
          >
            <p className="font-medium">
              {item.competencyName} · {item.groupName}
            </p>
            <p>
              Руководитель: {renderOptionalScore(item.managerScore)} ({item.managerRaters})
            </p>
            <p>
              Коллеги: {renderOptionalScore(item.peersScore)} ({item.peersRaters}) ·{" "}
              {renderVisibility(item.peersVisibility)}
            </p>
            <p>
              Подчинённые: {renderOptionalScore(item.subordinatesScore)} ({item.subordinatesRaters})
              {" · "}
              {renderVisibility(item.subordinatesVisibility)}
            </p>
            <p>
              Самооценка: {renderOptionalScore(item.selfScore)} ({item.selfRaters})
            </p>
            {item.otherVisibility ? (
              <p>
                Другие: {renderOptionalScore(item.otherScore)} ({item.otherRaters}) ·{" "}
                {renderVisibility(item.otherVisibility)}
              </p>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export const ResultsOpenTextCard = ({
  items,
  showRawText,
}: {
  items: ResultsOpenTextItem[] | undefined;
  showRawText: boolean;
}) => {
  const openText = items ?? [];

  return (
    <Card data-testid="results-open-text">
      <CardHeader>
        <CardTitle className="text-xl">Открытые комментарии</CardTitle>
        <CardDescription>
          {showRawText
            ? "HR видит оригинальные и обработанные комментарии."
            : "Сотрудник и руководитель видят только processed/summary без raw текста."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {openText.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="results-open-text-empty">
            Нет комментариев для отображения.
          </p>
        ) : (
          <div className="space-y-3">
            {openText.map((item, index) => (
              <div
                key={`${item.competencyId}:${item.group}:${index}`}
                className="rounded-md border p-3 text-sm"
                data-testid={`open-text-item-${index}`}
              >
                <p className="font-medium">
                  {groupLabels[item.group] ?? item.group} · competency{" "}
                  <span className="font-mono text-xs">{item.competencyId}</span> · count{" "}
                  {item.count}
                </p>
                {showRawText && item.rawText ? (
                  <p data-testid={`open-text-raw-${index}`}>Raw: {item.rawText}</p>
                ) : null}
                {item.processedText ? (
                  <p data-testid={`open-text-processed-${index}`}>
                    Processed: {item.processedText}
                  </p>
                ) : null}
                {item.summaryText ? (
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
