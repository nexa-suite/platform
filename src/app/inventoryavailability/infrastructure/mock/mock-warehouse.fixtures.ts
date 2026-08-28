import { PlatformTenantProfile } from '../../../core/security/runtime-config';
import { InventoryLot, Reservation, StockMovement, StorageZone, WarehouseSummary } from '../../domain/warehouse.models';

export interface MockWarehouseFixture {
  readonly warehouses: readonly WarehouseSummary[];
  readonly zones: readonly StorageZone[];
  readonly lots: readonly InventoryLot[];
  readonly movements: readonly StockMovement[];
  readonly reservations: readonly Reservation[];
}

function fixture(profile: PlatformTenantProfile): MockWarehouseFixture {
  const icisa = profile === 'icisa';
  const warehouseId = `${profile}-warehouse-001`;
  const zoneId = `${profile}-zone-001`;
  const firstCatalogItemId = `${profile}-catalog-001`;
  const secondCatalogItemId = `${profile}-catalog-002`;
  const clientAccountId = `${profile}-client-001`;
  const salesOrderId = `${profile}-sales-order-002`;
  const salesOrderNumber = icisa ? 'SO-ICISA-002' : 'SO-GEN-002';
  const firstLot: InventoryLot = {
    id: `${profile}-lot-001`, warehouseId, zoneId, catalogItemId: firstCatalogItemId,
    skuId: `${profile}-sku-001`, batchNumber: `${icisa ? 'ICISA' : 'GEN'}-BATCH-001`,
    expirationDate: '2026-12-31', receivedAt: '2026-01-10T08:00:00Z', onHand: 120,
    reserved: 20, available: 100, unit: icisa ? 'KG' : 'KG', status: 'AVAILABLE', version: 2,
  };
  const secondLot: InventoryLot = {
    id: `${profile}-lot-002`, warehouseId, zoneId, catalogItemId: secondCatalogItemId,
    skuId: `${profile}-sku-002`, batchNumber: `${icisa ? 'ICISA' : 'GEN'}-BATCH-002`,
    expirationDate: '2026-10-15', receivedAt: '2026-01-12T09:00:00Z', onHand: 48,
    reserved: 0, available: 48, unit: icisa ? 'KG' : 'CASE', status: 'AVAILABLE', version: 1,
  };
  return {
    warehouses: [{ id: warehouseId, code: icisa ? 'ICISA-CALLAO' : 'GEN-LIMA', name: icisa ? 'Centro de distribución ICISA' : 'Nexa Demo Lima', address: icisa ? 'Av. Néstor Gambetta 850, Callao' : 'Av. Demo 123, Lima', status: 'ACTIVE', version: 1 }],
    zones: [{ id: zoneId, warehouseId, code: 'CH-01', name: 'Cámara refrigerada 01', type: 'CHILLED', status: 'ACTIVE', version: 1, temperatureMin: 2, temperatureMax: 8 }],
    lots: [firstLot, secondLot],
    movements: [
      { id: `${profile}-movement-001`, lotId: firstLot.id, catalogItemId: firstCatalogItemId, skuId: firstLot.skuId, type: 'INBOUND_RECEIPT', quantity: firstLot.onHand, unit: firstLot.unit, quantityBefore: 0, quantityAfter: firstLot.onHand, reservedBefore: 0, reservedAfter: firstLot.reserved, reason: 'Initial demo receipt', occurredAt: '2026-01-10T08:00:00Z' },
      { id: `${profile}-movement-002`, lotId: firstLot.id, catalogItemId: firstCatalogItemId, skuId: firstLot.skuId, type: 'RESERVATION_CREATED', quantity: firstLot.reserved, unit: firstLot.unit, quantityBefore: firstLot.onHand, quantityAfter: firstLot.onHand, reservedBefore: 0, reservedAfter: firstLot.reserved, reason: 'Confirmed demo sales order', occurredAt: '2026-01-15T11:00:00Z' },
      { id: `${profile}-movement-003`, lotId: secondLot.id, catalogItemId: secondCatalogItemId, skuId: secondLot.skuId, type: 'INBOUND_RECEIPT', quantity: secondLot.onHand, unit: secondLot.unit, quantityBefore: 0, quantityAfter: secondLot.onHand, reservedBefore: 0, reservedAfter: 0, reason: 'Initial demo receipt', occurredAt: '2026-01-12T09:00:00Z' },
    ],
    reservations: [{
      id: `${profile}-reservation-001`, salesOrderId, orderNumber: salesOrderNumber, status: 'RESERVED',
      createdAt: '2026-01-15T11:00:00Z', reservedAt: '2026-01-15T11:02:00Z', expiresAt: '2026-01-17T11:02:00Z',
      version: 1, clientAccountId, allocations: [{ lotId: firstLot.id, quantity: firstLot.reserved, unit: firstLot.unit, expirationDate: firstLot.expirationDate }],
    }],
  };
}

export const MOCK_WAREHOUSE_FIXTURES: Readonly<Record<PlatformTenantProfile, MockWarehouseFixture>> = {
  generic: fixture('generic'),
  icisa: fixture('icisa'),
};
