const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDateOnly(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const match = DATE_ONLY_PATTERN.exec(value.trim());
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]) ? date : null;
}

export function toValidDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  if (typeof value === 'string' && DATE_ONLY_PATTERN.test(value.trim())) return parseDateOnly(value);
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function calendarMidnight(value: unknown): Date | null {
  const date = toValidDate(value);
  return date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : null;
}

export function differenceInCalendarDays(left: unknown, right: unknown): number | null {
  const leftDate = calendarMidnight(left);
  const rightDate = calendarMidnight(right);
  if (!leftDate || !rightDate) return null;
  return Math.round((leftDate.getTime() - rightDate.getTime()) / 86_400_000);
}

export function isExpired(value: unknown, today: unknown = new Date()): boolean {
  const difference = differenceInCalendarDays(value, today);
  return difference !== null && difference < 0;
}

export function isWithinDays(value: unknown, days: number, today: unknown = new Date()): boolean {
  const difference = differenceInCalendarDays(value, today);
  return difference !== null && difference >= 0 && difference <= Math.max(0, days);
}
