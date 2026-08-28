import { describe, expect, it } from 'vitest';
import { hasUnavailableItems } from './manual-order-step.guard';
import type { ManualOrderLine } from '../../domain/manual-orders/manual-order.models';

const line = (availabilityStatus: string): ManualOrderLine => ({
  id: 'line-1',
  skuId: 'sku-1',
  catalogItemId: 'catalog-1',
  productFamily: 'Demo product',
  familyCode: 'DEMO',
  skuCode: 'DEMO-001',
  presentation: 'Unit',
  unit: 'UNIT',
  quantity: 1,
  baseUnitPrice: 10,
  effectiveUnitPrice: 10,
  discountAmount: 0,
  currency: 'PEN',
  availabilityStatus,
  notes: null,
});

describe('manualOrderStepGuard availability', () => {
  it('does not block sellable catalog vocabulary used by the mock and API', () => {
    expect(hasUnavailableItems([line('AVAILABLE'), line('LOW'), line('LOW_STOCK'), line('IN_STOCK')])).toBe(false);
  });

  it('blocks explicit no-stock or no-sale states', () => {
    expect(hasUnavailableItems([line('OUT_OF_STOCK')])).toBe(true);
    expect(hasUnavailableItems([line('UNAVAILABLE')])).toBe(true);
  });
});
