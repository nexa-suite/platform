import { describe, expect, it } from 'vitest';
import { toCsv } from './export.util';

describe('export utilities', () => {
  it('creates an escaped CSV from the current server-backed rows', () => {
    expect(toCsv([{ code: 'CLI-1', address: 'Av. Lima, 10' }, { code: 'CLI-2', address: 'Cold\nStore' }])).toBe('code,address\r\nCLI-1,"Av. Lima, 10"\r\nCLI-2,"Cold\nStore"');
  });
  it('returns an empty document for an empty page', () => {
    expect(toCsv([])).toBe('');
  });
});
