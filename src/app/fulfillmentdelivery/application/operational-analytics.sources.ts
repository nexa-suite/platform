import { Observable } from 'rxjs';
import { DispatchOrder, OperationalAnalytics, OperationsDashboard } from '../domain/logistics.models';

export interface OperationalAnalyticsCatalogItem {
  readonly id: string;
  readonly name: string;
}

export interface OperationalAnalyticsCatalogPage {
  readonly items: readonly OperationalAnalyticsCatalogItem[];
  readonly totalItems: number;
}

export interface OperationalAnalyticsDocument {
  readonly status: string;
}

export interface OperationalAnalyticsDocumentPage {
  readonly items: readonly OperationalAnalyticsDocument[];
  readonly total: number;
}

export interface OperationalAnalyticsMovement {
  readonly id: string;
  readonly catalogItemId: string;
  readonly type: string;
  readonly occurredAt: string;
  readonly quantity: number;
  readonly unit: string;
}

export interface OperationalAnalyticsMovementPage {
  readonly items: readonly OperationalAnalyticsMovement[];
  readonly total: number;
}

/**
 * Local application contract for the analytics composition.
 * Cross-context adapters are assembled at the route composition root.
 */
export abstract class OperationalAnalyticsSourcesPort {
  abstract analytics(from: string, to: string): Observable<OperationalAnalytics>;
  abstract dashboard(): Observable<OperationsDashboard>;
  abstract dispatches(): Observable<{ readonly items: readonly DispatchOrder[] }>;
  abstract catalog(): Observable<OperationalAnalyticsCatalogPage>;
  abstract documents(): Observable<OperationalAnalyticsDocumentPage>;
  abstract movements(): Observable<OperationalAnalyticsMovementPage>;
}
