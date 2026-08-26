import { Observable } from 'rxjs';
import { ApiPage, DispatchAssignee, DispatchEvent, DispatchOrder, HandoffNote, OperationalAnalytics, OperationsDashboard, ProofOfDelivery } from '../logistics.models';

/** Fulfillment and delivery application port. */
export abstract class LogisticsApiPort {
  abstract dispatches(status?: string): Observable<ApiPage<DispatchOrder>>;
  abstract assignees(): Observable<readonly DispatchAssignee[]>;
  abstract create(reservationId: string, version: number): Observable<DispatchOrder>;
  abstract detail(id: string): Observable<DispatchOrder>;
  abstract events(id: string): Observable<readonly DispatchEvent[]>;
  abstract handoffNotes(id: string): Observable<readonly HandoffNote[]>;
  abstract dashboard(): Observable<OperationsDashboard>;
  abstract analytics(from: string, to: string): Observable<OperationalAnalytics>;
  abstract proof(status?: string): Observable<ApiPage<ProofOfDelivery>>;
  abstract prepare(item: DispatchOrder): Observable<DispatchOrder>;
  abstract assign(item: DispatchOrder, payload: { responsibleMembershipId: string; vehicleReference?: string; routeName?: string }): Observable<DispatchOrder>;
  abstract schedule(item: DispatchOrder, payload: { deliveryWindowStart: string; deliveryWindowEnd: string; eta?: string }): Observable<DispatchOrder>;
  abstract ready(item: DispatchOrder): Observable<DispatchOrder>;
  abstract startRoute(item: DispatchOrder): Observable<DispatchOrder>;
  abstract temperature(item: DispatchOrder, payload: { value: number; unit: string; source: string }): Observable<DispatchOrder>;
  abstract incident(item: DispatchOrder, payload: { type: string; severity: string; buyerVisible: boolean; description: string }): Observable<DispatchOrder>;
  abstract reprogram(item: DispatchOrder, payload: { deliveryWindowStart: string; deliveryWindowEnd: string; eta?: string; reason: string }): Observable<DispatchOrder>;
  abstract complete(item: DispatchOrder, payload: { receiverName: string; completedAt: string; notes?: string; photoEvidenceDeclared: boolean; signatureEvidenceDeclared: boolean }): Observable<DispatchOrder>;
  abstract appendHandoffNote(item: DispatchOrder, note: string): Observable<HandoffNote>;
}
