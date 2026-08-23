import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { ManualOrderWizardFacade } from '../application/manual-order-wizard.facade';

/** Creates the server draft before the first canonical wizard view is entered. */
export const createManualOrderDraftGuard: CanActivateFn = () => {
  const facade = inject(ManualOrderWizardFacade);
  const router = inject(Router);
  return facade.createDraft().pipe(
    map((draft) => router.createUrlTree(['/ops/commercial/manual-orders', draft.id, 'client'])),
    catchError(() => of(router.createUrlTree(['/ops/commercial/manual-orders/new'])))
  );
};
