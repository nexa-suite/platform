import { Routes } from '@angular/router';

export const TENANT_INVITATION_ACCEPTANCE_PATH = 'tenant-management/invitation-acceptance';

/** Route fragment owned by Tenant Administration; the shell must register it in the global route table. */
export const tenantManagementRoutes: Routes = [
  {
    path: TENANT_INVITATION_ACCEPTANCE_PATH,
    loadComponent: () => import('./presentation/invitation-acceptance-page/invitation-acceptance-page.component')
      .then((module) => module.InvitationAcceptancePageComponent)
  }
];
