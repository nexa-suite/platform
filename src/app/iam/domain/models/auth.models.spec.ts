import { describe, expect, it } from 'vitest';
import { isInternalRole, normalizeInternalRoles } from './auth.models';

describe('IAM domain roles', () => {
  it('keeps only internal roles and removes duplicates', () => {
    expect(normalizeInternalRoles(['ROLE_SALES', 'BUYER', 'SALES', 'warehouse'])).toEqual(['SALES', 'WAREHOUSE']);
    expect(isInternalRole('DISPATCH')).toBe(true);
    expect(isInternalRole('BUYER')).toBe(false);
  });
});
