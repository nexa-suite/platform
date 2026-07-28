export function toFiniteNumber(value: unknown, fallback = 0): number {
  const candidate = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : Number.NaN;
  return Number.isFinite(candidate) ? candidate : fallback;
}

export function clamp(value: unknown, min: number, max: number): number {
  const lower = Math.min(min, max);
  const upper = Math.max(min, max);
  return Math.min(upper, Math.max(lower, toFiniteNumber(value, lower)));
}

export function roundMoney(value: unknown): number {
  return Math.round((toFiniteNumber(value) + Number.EPSILON) * 100) / 100;
}
