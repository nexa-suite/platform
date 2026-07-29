import { describe, expect, it } from 'vitest';
import { parseColdChain, parseDirection, parsePage, parseSize, parseStatus } from './catalog.models';

describe('Catalog domain filters', () => {
  it('normalizes supported URL filters and safe defaults', () => {
    expect(parseColdChain('frozen')).toBe('FROZEN');
    expect(parseStatus('inactive')).toBe('INACTIVE');
    expect(parsePage('-1')).toBe(0);
    expect(parseSize('1000')).toBe(20);
    expect(parseDirection('DESC')).toBe('desc');
  });
});
