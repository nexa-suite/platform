import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { ManualOrderWizardFacade } from '../../application/manual-orders/manual-order-wizard.facade';
import { ManualOrderDraftStatus, ManualOrderLine } from '../../domain/manual-orders/manual-order.models';

type ManualOrderStep = 'client' | 'items' | 'delivery' | 'review';

const UNAVAILABLE_STATUSES = new Set([
  'BLOCKED',
  'DISCONTINUED',
  'NOT_AVAILABLE',
  'OUT_OF_STOCK',
  'REJECTED',
  'UNAVAILABLE',
]);

/**
 * Catalog availability and draft-line availability use different vocabularies.
 * Only explicit no-stock/no-sale states must block the delivery step; values
 * such as AVAILABLE, LOW, LOW_STOCK and IN_STOCK still represent sellable stock.
 */
export function hasUnavailableItems(lines: readonly ManualOrderLine[]): boolean {
  return lines.some((line) => UNAVAILABLE_STATUSES.has(line.availabilityStatus.trim().toUpperCase()));
}

export const manualOrderStepGuard: CanActivateFn = (route) => {
  const draftId = route.paramMap.get('draftId');
  if (!draftId) return true;
  const requested = (route.data['manualOrderStep'] ?? route.paramMap.get('step')) as ManualOrderStep;
  const facade = inject(ManualOrderWizardFacade);
  const router = inject(Router);
  return facade.draft(draftId).pipe(map((draft) => {
    const unavailableItems = hasUnavailableItems(draft.lines);
    const canonical = canonicalStep(draft.status, unavailableItems);
    if (draft.status === 'ABANDONED') return router.createUrlTree(['/ops/commercial/manual-orders/new']);
    if (draft.status === 'CREATED' && requested !== 'review') {
      return router.createUrlTree(['/ops/commercial/manual-orders', draftId, 'review']);
    }
    return isReachable(requested, draft.status, unavailableItems)
      ? true : router.createUrlTree(['/ops/commercial/manual-orders', draftId, canonical]);
  }));
};

function canonicalStep(status: ManualOrderDraftStatus, hasUnavailableItems: boolean): ManualOrderStep {
  if (status === 'DRAFT') return 'client';
  if (status === 'CLIENT_COMPLETE') return 'items';
  if (status === 'ITEMS_COMPLETE') return 'delivery';
  if (status === 'DELIVERY_COMPLETE') return 'review';
  if (status === 'READY_TO_CREATE' && !hasUnavailableItems) return 'review';
  if (status === 'CREATED') return 'review';
  return 'review';
}

function isReachable(step: ManualOrderStep, status: ManualOrderDraftStatus, hasUnavailableItems: boolean): boolean {
  if (step === 'client') return status !== 'CREATED' && status !== 'ABANDONED';
  if (step === 'items') return status !== 'DRAFT' && status !== 'CREATED' && status !== 'ABANDONED';
  if (step === 'delivery') return (status === 'ITEMS_COMPLETE' || status === 'DELIVERY_COMPLETE' || status === 'READY_TO_CREATE') && !hasUnavailableItems;
  return status === 'DELIVERY_COMPLETE' || status === 'READY_TO_CREATE' || status === 'CREATED';
}
