import { describe, expect, it } from 'vitest';
import { TENANT_INVITATION_ACCEPTANCE_PATH, tenantManagementRoutes } from './tenant-management.routes';

describe('tenantManagementRoutes', () => {
  it('exposes the public invitation acceptance route fragment', () => {
    expect(TENANT_INVITATION_ACCEPTANCE_PATH).toBe('tenant-management/invitation-acceptance');
    expect(tenantManagementRoutes).toEqual(expect.arrayContaining([expect.objectContaining({ path: TENANT_INVITATION_ACCEPTANCE_PATH })]));
  });
});
