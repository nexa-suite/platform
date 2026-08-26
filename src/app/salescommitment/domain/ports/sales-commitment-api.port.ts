import { Observable } from 'rxjs';
import {
  CreateManualSalesOrderCommand,
  CreatePurchaseRequestCommand,
  PurchaseRequest,
  PurchaseRequestAction,
  PurchaseRequestEvent,
  PurchaseRequestFilters,
  PurchaseRequestLineCommand,
  PurchaseRequestPage,
  UpdatePurchaseRequestCommand,
  UpdatePurchaseRequestLineCommand
} from '../purchase-requests/purchase-request.models';
import { ManualOrderClientCommand, ManualOrderDeliveryCommand, ManualOrderDraft, ManualOrderLineCommand, ManualOrderReview } from '../manual-orders/manual-order.models';
import { FulfillmentCandidate, SalesOrder, SalesOrderEvent, SalesOrderFilters, SalesOrderPage } from '../sales-orders/sales-order.models';

/** BC-04 application port for sales commitments and their HTTP adapter. */
export abstract class SalesCommitmentApiPort {
  abstract createManualSalesOrder(command: CreateManualSalesOrderCommand): Observable<SalesOrder>;
  abstract createManualSalesOrderDraft(idempotencyKey?: string): Observable<ManualOrderDraft>;
  abstract manualSalesOrderDraft(id: string): Observable<ManualOrderDraft>;
  abstract updateManualSalesOrderDraftClient(id: string, version: number, command: ManualOrderClientCommand): Observable<ManualOrderDraft>;
  abstract replaceManualSalesOrderDraftItems(id: string, version: number, lines: readonly ManualOrderLineCommand[]): Observable<ManualOrderDraft>;
  abstract updateManualSalesOrderDraftDelivery(id: string, version: number, command: ManualOrderDeliveryCommand): Observable<ManualOrderDraft>;
  abstract reviewManualSalesOrderDraft(id: string): Observable<ManualOrderReview>;
  abstract submitManualSalesOrderDraft(id: string, version: number, idempotencyKey?: string): Observable<SalesOrder>;
  abstract abandonManualSalesOrderDraft(id: string, version: number): Observable<ManualOrderDraft>;
  abstract createPurchaseRequest(command: CreatePurchaseRequestCommand): Observable<PurchaseRequest>;
  abstract updatePurchaseRequest(id: string, version: number, command: UpdatePurchaseRequestCommand): Observable<PurchaseRequest>;
  abstract addPurchaseRequestLine(id: string, version: number, command: PurchaseRequestLineCommand): Observable<PurchaseRequest>;
  abstract updatePurchaseRequestLine(id: string, lineId: string, version: number, command: UpdatePurchaseRequestLineCommand): Observable<PurchaseRequest>;
  abstract deletePurchaseRequestLine(id: string, lineId: string, version: number): Observable<PurchaseRequest>;
  abstract submitPurchaseRequest(id: string, version: number): Observable<PurchaseRequest>;
  abstract purchaseRequests(filters?: PurchaseRequestFilters): Observable<PurchaseRequestPage>;
  abstract purchaseRequest(id: string): Observable<PurchaseRequest>;
  abstract purchaseRequestEvents(id: string): Observable<readonly PurchaseRequestEvent[]>;
  abstract transitionPurchaseRequest(id: string, version: number, action: PurchaseRequestAction, note?: string): Observable<PurchaseRequest>;
  abstract transition(id: string, version: number, action: PurchaseRequestAction, note?: string): Observable<PurchaseRequest>;
  abstract convertPurchaseRequestToOrder(purchaseRequestId: string, version: number, idempotencyKey: string, note?: string): Observable<SalesOrder>;
  abstract salesOrders(filters?: SalesOrderFilters): Observable<SalesOrderPage>;
  abstract salesOrder(id: string): Observable<SalesOrder>;
  abstract confirmSalesOrder(id: string, version: number): Observable<SalesOrder>;
  abstract rejectSalesOrder(id: string, version: number, reason: string): Observable<SalesOrder>;
  abstract cancelSalesOrder(id: string, version: number, reason?: string): Observable<SalesOrder>;
  abstract salesOrderEvents(id: string): Observable<readonly SalesOrderEvent[]>;
  abstract fulfillmentCandidates(): Observable<readonly FulfillmentCandidate[]>;
}
