export function getSingleQueryParam(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value.trim() || undefined;
  }

  if (Array.isArray(value)) {
    const first = value.find((item): item is string => typeof item === "string" && item.trim().length > 0);
    return first?.trim() || undefined;
  }

  return undefined;
}

export function getQueryNumber(value: unknown, fallback: number): number {
  const parsed = Number(getSingleQueryParam(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}
