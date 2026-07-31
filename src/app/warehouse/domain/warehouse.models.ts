export interface WarehouseSummary { id: string; code: string; name: string; address?: string; status: string; version: number; }
export interface StorageZone { id: string; warehouseId: string; code: string; name: string; type: string; status: string; version: number; temperatureMin?: number; temperatureMax?: number; }
export interface InventoryLot { id: string; warehouseId: string; zoneId: string; catalogItemId: string; batchNumber: string; expirationDate: string; receivedAt: string; onHand: number; reserved: number; available: number; unit: string; status: string; version: number; }
export interface StockMovement { id: string; lotId: string; catalogItemId: string; type: string; quantity: number; unit: string; quantityBefore: number; quantityAfter: number; reservedBefore: number; reservedAfter: number; reason?: string; occurredAt: string; }
export interface Reservation { id: string; salesOrderId: string; orderNumber: string; status: string; createdAt: string; reservedAt?: string; expiresAt: string; version: number; }
export interface InventoryAvailability { catalogItemId: string; status: 'AVAILABLE' | 'UNAVAILABLE' | 'UNKNOWN'; asOf: string; }
export interface ApiPage<T> { items: readonly T[]; page: number; size: number; total: number; }
