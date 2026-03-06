const parseDelay = (value: string | string[] | undefined): number => {
  const rawValue = typeof value === "string" ? value : value?.[0];
  const parsed = Number.parseInt(rawValue ?? "", 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  return Math.min(parsed, 3_000);
};

export const applyDebugPageDelay = async (
  value: string | string[] | undefined,
): Promise<number> => {
  const delayMs = parseDelay(value);
  if (delayMs === 0) {
    return 0;
  }

  await new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });

  return delayMs;
};
