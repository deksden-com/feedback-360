const getTrimmedString = (value: FormDataEntryValue | null): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const setIndicatorResponse = (
  target: Record<string, Record<string, number | "NA">>,
  competencyId: string,
  indicatorId: string,
  rawValue: string,
) => {
  const value = rawValue.trim();
  if (value.length === 0) {
    return;
  }

  if (value !== "NA" && !["1", "2", "3", "4", "5"].includes(value)) {
    return;
  }

  const competencyResponses = target[competencyId] ?? {};
  competencyResponses[indicatorId] = value === "NA" ? "NA" : Number(value);
  target[competencyId] = competencyResponses;
};

const setLevelResponse = (
  target: Record<string, number | "UNSURE">,
  competencyId: string,
  rawValue: string,
) => {
  const value = rawValue.trim();
  if (value.length === 0) {
    return;
  }

  if (value !== "UNSURE" && !["1", "2", "3", "4"].includes(value)) {
    return;
  }

  target[competencyId] = value === "UNSURE" ? "UNSURE" : Number(value);
};

export const parseQuestionnaireDraftFromFormData = (form: FormData): Record<string, unknown> => {
  const indicatorResponses: Record<string, Record<string, number | "NA">> = {};
  const levelResponses: Record<string, number | "UNSURE"> = {};
  const competencyComments: Record<string, { rawText: string }> = {};

  for (const [key, value] of form.entries()) {
    if (typeof value !== "string") {
      continue;
    }

    if (key.startsWith("indicator:")) {
      const [, competencyId, indicatorId] = key.split(":");
      if (!competencyId || !indicatorId) {
        continue;
      }
      setIndicatorResponse(indicatorResponses, competencyId, indicatorId, value);
      continue;
    }

    if (key.startsWith("level:")) {
      const [, competencyId] = key.split(":");
      if (!competencyId) {
        continue;
      }
      setLevelResponse(levelResponses, competencyId, value);
      continue;
    }

    if (key.startsWith("comment:")) {
      const [, competencyId] = key.split(":");
      const trimmed = value.trim();
      if (!competencyId || trimmed.length === 0) {
        continue;
      }
      competencyComments[competencyId] = {
        rawText: trimmed,
      };
    }
  }

  const finalComment = getTrimmedString(form.get("finalComment"));
  const legacyNote = getTrimmedString(form.get("note"));

  return {
    ...(Object.keys(indicatorResponses).length > 0 ? { indicatorResponses } : {}),
    ...(Object.keys(levelResponses).length > 0 ? { levelResponses } : {}),
    ...(Object.keys(competencyComments).length > 0 ? { competencyComments } : {}),
    ...(finalComment ? { finalComment: { rawText: finalComment } } : {}),
    ...(legacyNote ? { note: legacyNote } : {}),
  };
};
