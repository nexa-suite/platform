import { clamp, roundMoney, toFiniteNumber } from './number.util';

describe('number utilities', () => {
  it('normalizes numeric strings and invalid values', () => { expect(toFiniteNumber('12.5')).toBe(12.5); expect(toFiniteNumber('x', 4)).toBe(4); expect(toFiniteNumber(Infinity)).toBe(0); });
  it('clamps with normalized inverted limits', () => { expect(clamp(8, 10, 2)).toBe(8); expect(clamp(-1, 2, 10)).toBe(2); });
  it('rounds money to cents', () => { expect(roundMoney(12.345)).toBe(12.35); });
});
