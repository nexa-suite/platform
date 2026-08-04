import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { SalesOperationsApiService } from '../../infrastructure/http/sales-operations-api.service';
import { ManualOrderDraftStatus } from '../domain/manual-order.models';

type ManualOrderStep = 'client' | 'items' | 'delivery' | 'review';

export const manualOrderStepGuard: CanActivateFn = (route) => {
  const draftId = route.paramMap.get('draftId');
  if (!draftId) return true;
  const requested = (route.data['manualOrderStep'] ?? route.paramMap.get('step')) as ManualOrderStep;
  const api = inject(SalesOperationsApiService);
  const router = inject(Router);
  return api.manualSalesOrderDraft(draftId).pipe(map((draft) => {
    const canonical = canonicalStep(draft.status, draft.lines.some((line) => line.availabilityStatus !== 'AVAILABLE'));
    if (draft.status === 'ABANDONED') return router.createUrlTree(['/ops/commercial/manual-orders/new']);
    if (draft.status === 'CREATED' && requested !== 'review') {
      return router.createUrlTree(['/ops/commercial/manual-orders', draftId, 'review']);
    }
    return isReachable(requested, draft.status, draft.lines.some((line) => line.availabilityStatus !== 'AVAILABLE'))
      ? true : router.createUrlTree(['/ops/commercial/manual-orders', draftId, canonical]);
  }));
};

function canonicalStep(status: ManualOrderDraftStatus, hasUnavailableItems: boolean): ManualOrderStep {
  if (status === 'DRAFT') return 'client';
  if (status === 'CLIENT_COMPLETE') return 'items';
  if (status === 'ITEMS_COMPLETE') return 'delivery';
  if (status === 'READY_TO_CREATE' && !hasUnavailableItems) return 'review';
  if (status === 'CREATED') return 'review';
  return 'review';
}

function isReachable(step: ManualOrderStep, status: ManualOrderDraftStatus, hasUnavailableItems: boolean): boolean {
  if (step === 'client') return status !== 'CREATED' && status !== 'ABANDONED';
  if (step === 'items') return status !== 'DRAFT' && status !== 'CREATED' && status !== 'ABANDONED';
  if (step === 'delivery') return (status === 'ITEMS_COMPLETE' || status === 'DELIVERY_COMPLETE' || status === 'READY_TO_CREATE') && !hasUnavailableItems;
  return status === 'READY_TO_CREATE' || status === 'CREATED';
}
