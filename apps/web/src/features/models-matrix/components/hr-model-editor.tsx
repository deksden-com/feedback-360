"use client";

import { useMemo, useState } from "react";

import { InlineBanner } from "@/components/page-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFriendlyErrorCopy } from "@/lib/page-state";
import type { ModelVersionGetOutput, OperationError } from "@feedback-360/api-contract";

import {
  type ModelEditorDraft,
  countModelDefinition,
  modelKindLabels,
  modelStatusLabels,
} from "../lib/models-matrix";

/**
 * HR model editor for create, edit, and readonly model-version surfaces.
 * @docs .memory-bank/spec/ui/screens/hr-model-detail.md
 * @see .memory-bank/spec/domain/competency-models.md
 */
type SaveResponse = {
  ok: true;
  data: {
    modelVersionId: string;
  };
};

type ErrorResponse = {
  ok: false;
  error: OperationError;
};

const cloneDraft = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const HrModelEditor = ({
  initialDraft,
  model,
  mode,
  canMutate,
}: {
  initialDraft: ModelEditorDraft;
  model?: ModelVersionGetOutput;
  mode: "create" | "edit" | "readonly";
  canMutate: boolean;
}) => {
  const [draft, setDraft] = useState<ModelEditorDraft>(() => cloneDraft(initialDraft));
  const [error, setError] = useState<OperationError | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const counts = useMemo(() => countModelDefinition(draft.groups), [draft.groups]);
  const clientError = error
    ? getFriendlyErrorCopy(error, {
        title: "Не удалось сохранить модель",
        description: "Проверьте структуру draft и попробуйте снова.",
      })
    : null;
  const isReadonly = mode === "readonly" || !canMutate;
  const canPublish = canMutate && mode !== "create" && draft.status === "draft";
  const totalWeightValid = counts.totalWeight === 100;

  const updateGroup = (
    groupIndex: number,
    updater: (group: ModelEditorDraft["groups"][number]) => ModelEditorDraft["groups"][number],
  ) => {
    setDraft((current) => ({
      ...current,
      groups: current.groups.map((group, index) => (index === groupIndex ? updater(group) : group)),
    }));
  };

  const saveDraft = async () => {
    setIsSaving(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/hr/models/draft", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        modelVersionId: draft.modelVersionId,
        name: draft.name,
        kind: draft.kind,
        groups: draft.groups,
      }),
    });

    const payload = (await response.json()) as SaveResponse | ErrorResponse;
    setIsSaving(false);

    if (!payload.ok) {
      setError(payload.error);
      return;
    }

    setMessage("Черновик модели сохранён.");
    window.location.assign(`/hr/models/${payload.data.modelVersionId}?saved=1`);
  };

  const publishDraft = async () => {
    if (!draft.modelVersionId) {
      return;
    }

    setIsPublishing(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/hr/models/publish", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        modelVersionId: draft.modelVersionId,
      }),
    });

    const payload = (await response.json()) as SaveResponse | ErrorResponse;
    setIsPublishing(false);

    if (!payload.ok) {
      setError(payload.error);
      return;
    }

    window.location.assign(`/hr/models/${payload.data.modelVersionId}?published=1`);
  };

  return (
    <div className="space-y-4" data-testid="model-editor-root">
      {message ? (
        <InlineBanner description={message} tone="success" testId="model-editor-flash" />
      ) : null}
      {clientError ? (
        <InlineBanner
          title={clientError.title}
          description={clientError.description}
          tone="error"
          testId="model-editor-error"
        />
      ) : null}

      <Card data-testid="model-editor-summary">
        <CardHeader>
          <CardTitle className="text-xl">
            {mode === "create"
              ? "Новая модель"
              : mode === "edit"
                ? "Редактор черновика"
                : "Просмотр версии"}
          </CardTitle>
          <CardDescription>
            Draft-first workflow: редактируем только черновики, published версии остаются read-only
            и клонируются в новый draft.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="model-name">Название модели</Label>
              <Input
                id="model-name"
                value={draft.name}
                disabled={isReadonly}
                data-testid="model-editor-name"
                onChange={(event) =>
                  setDraft((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="model-kind">Режим оценки</Label>
              <select
                id="model-kind"
                value={draft.kind}
                disabled={isReadonly || Boolean(draft.modelVersionId)}
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                data-testid="model-editor-kind"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    kind: event.target.value === "levels" ? "levels" : "indicators",
                    groups: current.kind === event.target.value ? current.groups : [],
                  }))
                }
              >
                <option value="indicators">{modelKindLabels.indicators}</option>
                <option value="levels">{modelKindLabels.levels}</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 text-sm">
            <div>
              <p className="text-muted-foreground">Статус</p>
              <p className="font-medium" data-testid="model-editor-status">
                {draft.status ? modelStatusLabels[draft.status] : "Новый draft"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Сводка структуры</p>
              <p data-testid="model-editor-counts">
                Групп: {counts.groupCount} · Компетенций: {counts.competencyCount} ·{" "}
                {draft.kind === "indicators"
                  ? `Индикаторов: ${counts.indicatorCount}`
                  : `Уровней: ${counts.levelCount}`}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Сумма весов</p>
              <p data-testid="model-editor-total-weight">{counts.totalWeight}%</p>
            </div>
            {!totalWeightValid ? (
              <InlineBanner
                description="Сумма весов групп должна быть ровно 100%, иначе publish будет заблокирован."
                tone="warning"
                testId="model-editor-weight-warning"
              />
            ) : null}
            {model?.status === "published" ? (
              <div className="text-muted-foreground" data-testid="model-editor-readonly-copy">
                Версия опубликована. Чтобы изменить структуру, создайте clone draft из каталога или
                с этой страницы.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {draft.groups.map((group, groupIndex) => (
          <Card
            key={`${group.name}:${group.weight}:${group.competencies.length}`}
            data-testid={`model-group-${groupIndex}`}
          >
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">Группа {groupIndex + 1}</CardTitle>
                  <CardDescription>
                    Вес влияет на итоговую агрегацию модели. Внутри — competencies и их
                    indicator/level items.
                  </CardDescription>
                </div>
                {!isReadonly ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    data-testid={`remove-group-${groupIndex}`}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        groups: current.groups.filter((_, index) => index !== groupIndex),
                      }))
                    }
                  >
                    Удалить группу
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[1fr_140px]">
                <div className="grid gap-2">
                  <Label>Название группы</Label>
                  <Input
                    value={group.name}
                    disabled={isReadonly}
                    data-testid={`group-name-${groupIndex}`}
                    onChange={(event) =>
                      updateGroup(groupIndex, (current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Вес (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={String(group.weight)}
                    disabled={isReadonly}
                    data-testid={`group-weight-${groupIndex}`}
                    onChange={(event) =>
                      updateGroup(groupIndex, (current) => ({
                        ...current,
                        weight: Number(event.target.value || 0),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                {group.competencies.map((competency, competencyIndex) => (
                  <div
                    key={`${competency.name}:${competency.indicators?.length ?? 0}:${competency.levels?.length ?? 0}`}
                    className="rounded-lg border p-4"
                    data-testid={`competency-${groupIndex}-${competencyIndex}`}
                  >
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <div className="grid flex-1 gap-2">
                        <Label>Компетенция</Label>
                        <Input
                          value={competency.name}
                          disabled={isReadonly}
                          data-testid={`competency-name-${groupIndex}-${competencyIndex}`}
                          onChange={(event) =>
                            updateGroup(groupIndex, (current) => ({
                              ...current,
                              competencies: current.competencies.map((item, index) =>
                                index === competencyIndex
                                  ? { ...item, name: event.target.value }
                                  : item,
                              ),
                            }))
                          }
                        />
                      </div>
                      {!isReadonly ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid={`remove-competency-${groupIndex}-${competencyIndex}`}
                          onClick={() =>
                            updateGroup(groupIndex, (current) => ({
                              ...current,
                              competencies: current.competencies.filter(
                                (_, index) => index !== competencyIndex,
                              ),
                            }))
                          }
                        >
                          Удалить
                        </Button>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        {draft.kind === "indicators" ? "Индикаторы" : "Уровни"}
                      </p>
                      {draft.kind === "indicators"
                        ? (competency.indicators ?? []).map((indicator, indicatorIndex) => (
                            <div
                              key={`${indicator.order ?? indicatorIndex + 1}:${indicator.text}`}
                              className="grid gap-2 md:grid-cols-[120px_1fr_auto]"
                            >
                              <Input
                                type="number"
                                min="1"
                                value={String(indicator.order ?? indicatorIndex + 1)}
                                disabled={isReadonly}
                                data-testid={`indicator-order-${groupIndex}-${competencyIndex}-${indicatorIndex}`}
                                onChange={(event) =>
                                  updateGroup(groupIndex, (current) => ({
                                    ...current,
                                    competencies: current.competencies.map((item, index) =>
                                      index === competencyIndex
                                        ? {
                                            ...item,
                                            indicators: (item.indicators ?? []).map(
                                              (entry, entryIndex) =>
                                                entryIndex === indicatorIndex
                                                  ? {
                                                      ...entry,
                                                      order: Number(
                                                        event.target.value || indicatorIndex + 1,
                                                      ),
                                                    }
                                                  : entry,
                                            ),
                                          }
                                        : item,
                                    ),
                                  }))
                                }
                              />
                              <Input
                                value={indicator.text}
                                disabled={isReadonly}
                                data-testid={`indicator-text-${groupIndex}-${competencyIndex}-${indicatorIndex}`}
                                onChange={(event) =>
                                  updateGroup(groupIndex, (current) => ({
                                    ...current,
                                    competencies: current.competencies.map((item, index) =>
                                      index === competencyIndex
                                        ? {
                                            ...item,
                                            indicators: (item.indicators ?? []).map(
                                              (entry, entryIndex) =>
                                                entryIndex === indicatorIndex
                                                  ? { ...entry, text: event.target.value }
                                                  : entry,
                                            ),
                                          }
                                        : item,
                                    ),
                                  }))
                                }
                              />
                              {!isReadonly ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  data-testid={`remove-indicator-${groupIndex}-${competencyIndex}-${indicatorIndex}`}
                                  onClick={() =>
                                    updateGroup(groupIndex, (current) => ({
                                      ...current,
                                      competencies: current.competencies.map((item, index) =>
                                        index === competencyIndex
                                          ? {
                                              ...item,
                                              indicators: (item.indicators ?? []).filter(
                                                (_, entryIndex) => entryIndex !== indicatorIndex,
                                              ),
                                            }
                                          : item,
                                      ),
                                    }))
                                  }
                                >
                                  Удалить
                                </Button>
                              ) : null}
                            </div>
                          ))
                        : (competency.levels ?? []).map((level, levelIndex) => (
                            <div
                              key={`${level.level}:${level.text}`}
                              className="grid gap-2 md:grid-cols-[120px_1fr_auto]"
                            >
                              <Input
                                type="number"
                                min="1"
                                max="4"
                                value={String(level.level)}
                                disabled={isReadonly}
                                data-testid={`level-value-${groupIndex}-${competencyIndex}-${levelIndex}`}
                                onChange={(event) =>
                                  updateGroup(groupIndex, (current) => ({
                                    ...current,
                                    competencies: current.competencies.map((item, index) =>
                                      index === competencyIndex
                                        ? {
                                            ...item,
                                            levels: (item.levels ?? []).map((entry, entryIndex) =>
                                              entryIndex === levelIndex
                                                ? {
                                                    ...entry,
                                                    level: Number(event.target.value || 1),
                                                  }
                                                : entry,
                                            ),
                                          }
                                        : item,
                                    ),
                                  }))
                                }
                              />
                              <Input
                                value={level.text}
                                disabled={isReadonly}
                                data-testid={`level-text-${groupIndex}-${competencyIndex}-${levelIndex}`}
                                onChange={(event) =>
                                  updateGroup(groupIndex, (current) => ({
                                    ...current,
                                    competencies: current.competencies.map((item, index) =>
                                      index === competencyIndex
                                        ? {
                                            ...item,
                                            levels: (item.levels ?? []).map((entry, entryIndex) =>
                                              entryIndex === levelIndex
                                                ? { ...entry, text: event.target.value }
                                                : entry,
                                            ),
                                          }
                                        : item,
                                    ),
                                  }))
                                }
                              />
                              {!isReadonly ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  data-testid={`remove-level-${groupIndex}-${competencyIndex}-${levelIndex}`}
                                  onClick={() =>
                                    updateGroup(groupIndex, (current) => ({
                                      ...current,
                                      competencies: current.competencies.map((item, index) =>
                                        index === competencyIndex
                                          ? {
                                              ...item,
                                              levels: (item.levels ?? []).filter(
                                                (_, entryIndex) => entryIndex !== levelIndex,
                                              ),
                                            }
                                          : item,
                                      ),
                                    }))
                                  }
                                >
                                  Удалить
                                </Button>
                              ) : null}
                            </div>
                          ))}
                    </div>

                    {!isReadonly ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid={`add-${draft.kind === "indicators" ? "indicator" : "level"}-${groupIndex}-${competencyIndex}`}
                          onClick={() =>
                            updateGroup(groupIndex, (current) => ({
                              ...current,
                              competencies: current.competencies.map((item, index) =>
                                index === competencyIndex
                                  ? draft.kind === "indicators"
                                    ? {
                                        ...item,
                                        indicators: [
                                          ...(item.indicators ?? []),
                                          {
                                            text: "Новый индикатор",
                                            order: (item.indicators?.length ?? 0) + 1,
                                          },
                                        ],
                                      }
                                    : {
                                        ...item,
                                        levels: [
                                          ...(item.levels ?? []),
                                          {
                                            level: Math.min((item.levels?.length ?? 0) + 1, 4),
                                            text: "Описание уровня",
                                          },
                                        ],
                                      }
                                  : item,
                              ),
                            }))
                          }
                        >
                          Добавить {draft.kind === "indicators" ? "индикатор" : "уровень"}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              {!isReadonly ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-testid={`add-competency-${groupIndex}`}
                  onClick={() =>
                    updateGroup(groupIndex, (current) => ({
                      ...current,
                      competencies: [
                        ...current.competencies,
                        draft.kind === "indicators"
                          ? {
                              name: "Новая компетенция",
                              indicators: [{ text: "Новый индикатор", order: 1 }],
                            }
                          : {
                              name: "Новая компетенция",
                              levels: [{ level: 1, text: "Описание уровня" }],
                            },
                      ],
                    }))
                  }
                >
                  Добавить компетенцию
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      {!isReadonly ? (
        <Button
          type="button"
          variant="outline"
          data-testid="add-group"
          onClick={() =>
            setDraft((current) => ({
              ...current,
              groups: [
                ...current.groups,
                {
                  name: `Новая группа ${current.groups.length + 1}`,
                  weight: current.groups.length === 0 ? 100 : 0,
                  competencies: [
                    current.kind === "indicators"
                      ? {
                          name: "Новая компетенция",
                          indicators: [{ text: "Новый индикатор", order: 1 }],
                        }
                      : {
                          name: "Новая компетенция",
                          levels: [{ level: 1, text: "Описание уровня" }],
                        },
                  ],
                },
              ],
            }))
          }
        >
          Добавить группу
        </Button>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Действия</CardTitle>
          <CardDescription>
            Сохраняем draft сколько угодно раз. Publish доступен только для корректной структуры и
            только для draft версии.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {canMutate ? (
            <Button
              type="button"
              disabled={isSaving}
              data-testid="model-editor-save"
              onClick={saveDraft}
            >
              {isSaving ? "Сохраняем…" : mode === "create" ? "Создать draft" : "Сохранить draft"}
            </Button>
          ) : null}
          {canPublish ? (
            <Button
              type="button"
              variant="outline"
              disabled={isPublishing || !totalWeightValid}
              data-testid="model-editor-publish"
              onClick={publishDraft}
            >
              {isPublishing ? "Публикуем…" : "Опубликовать версию"}
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <a href="/hr/models">Вернуться к каталогу</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
