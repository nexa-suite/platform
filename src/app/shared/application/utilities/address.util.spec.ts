import { formatAddress } from './address.util';

describe('formatAddress', () => {
  it('trims, removes empty values and deduplicates case-insensitively', () => { expect(formatAddress(' Lima ', 'lima', null, '', 'Peru')).toBe('Lima, Peru'); });
  it('returns an empty string without nullish output', () => { expect(formatAddress(undefined, null, '  ')).toBe(''); });
});
