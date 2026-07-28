import { differenceInCalendarDays, isExpired, isWithinDays, parseDateOnly, toValidDate } from './date.util';

describe('date utilities', () => {
  it('parses date-only values in local calendar time', () => { const date = parseDateOnly('2026-07-28'); expect(date?.getFullYear()).toBe(2026); expect(date?.getDate()).toBe(28); });
  it('rejects invalid dates without exposing Invalid Date', () => { expect(toValidDate('nope')).toBeNull(); expect(parseDateOnly('2026-02-30')).toBeNull(); });
  it('compares calendar days for past, same and future values', () => { expect(differenceInCalendarDays('2026-07-28', '2026-07-27')).toBe(1); expect(isExpired('2026-07-27', '2026-07-28')).toBe(true); expect(isWithinDays('2026-07-30', 2, '2026-07-28')).toBe(true); });
});
