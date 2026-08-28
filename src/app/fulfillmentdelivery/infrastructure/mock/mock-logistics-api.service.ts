import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { ApiPage, DispatchAssignee, DispatchEvent, DispatchOrder, HandoffNote, OperationalAnalytics, OperationsDashboard, ProofOfDelivery } from '../../domain/logistics.models';
import { LogisticsApiPort } from '../../domain/ports/logistics-api.port';
import { MOCK_LOGISTICS_FIXTURES } from './mock-logistics.fixtures';

const DEMO_NOW = '2026-08-26T10:00:00Z';

/** BC-06 in-memory adapter for local operations and delivery workflow demos. */
@Injectable({ providedIn: 'root' })
export class MockLogisticsApiService extends LogisticsApiPort {
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);
  private readonly seed = MOCK_LOGISTICS_FIXTURES[this.config.tenantProfile];
  private readonly dispatchStore = new Map(this.seed.dispatches.map((item) => [item.id, item]));
  private readonly eventStore = new Map<string, DispatchEvent[]>(this.seed.dispatches.map((item) => [item.id, this.seed.events.filter((event) => event.id.startsWith(item.id))]));
  private readonly handoffStore = new Map<string, HandoffNote[]>(this.seed.dispatches.map((item) => [item.id, this.seed.handoffNotes.filter((note) => note.dispatchOrderId === item.id)]));
  private readonly proofStore = new Map(this.seed.proof.map((item) => [item.dispatchOrderId, item]));
  private nextDispatch = this.dispatchStore.size + 1;
  private nextEvent = this.seed.events.length + 1;
  private nextHandoff = this.seed.handoffNotes.length + 1;

  dispatches(status?: string): Observable<ApiPage<DispatchOrder>> {
    const items = [...this.dispatchStore.values()].filter((item) => !status || item.status === status).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return of(this.page(items));
  }

  assignees(): Observable<readonly DispatchAssignee[]> { return of(this.seed.assignees); }

  create(reservationId: string, version: number): Observable<DispatchOrder> {
    return this.operation(() => {
      const id = `${this.config.tenantProfile}-dispatch-${String(this.nextDispatch++).padStart(3, '0')}`;
      const prefix = this.config.tenantProfile === 'icisa' ? 'ICISA' : 'GEN';
      const item: DispatchOrder = { id, dispatchNumber: `DO-${prefix}-${String(this.nextDispatch - 1).padStart(3, '0')}`, reservationId, salesOrderId: null, salesOrderNumber: 'PENDING', clientAccountId: null, clientCode: null, clientName: null, status: 'READY_FOR_OPERATIONS', destination: null, deliveryArea: null, priority: 'NORMAL', deliveryWindowStart: null, deliveryWindowEnd: null, eta: null, assignment: null, temperatureMin: 2, temperatureMax: 8, temperatureUnit: 'CELSIUS', temperatureStatus: 'NORMAL', podId: null, podStatus: 'PENDING', version, updatedAt: DEMO_NOW, alerts: [] };
      this.dispatchStore.set(id, item);
      this.eventStore.set(id, []);
      this.handoffStore.set(id, []);
      this.proofStore.set(id, { podId: null, dispatchOrderId: id, dispatchNumber: item.dispatchNumber, status: 'PENDING', receiverName: null, completedAt: null, notes: null, photoEvidenceDeclared: false, signatureEvidenceDeclared: false, updatedAt: DEMO_NOW });
      return this.recordStatus(item, null, 'READY_FOR_OPERATIONS', 'Dispatch Order creado desde la reserva.');
    });
  }

  detail(id: string): Observable<DispatchOrder> { return this.required(this.dispatchStore.get(id), 'MOCK_DISPATCH_NOT_FOUND'); }
  events(id: string): Observable<readonly DispatchEvent[]> { return this.required(this.eventStore.get(id), 'MOCK_DISPATCH_NOT_FOUND'); }
  handoffNotes(id: string): Observable<readonly HandoffNote[]> { return this.required(this.handoffStore.get(id), 'MOCK_DISPATCH_NOT_FOUND'); }

  dashboard(): Observable<OperationsDashboard> {
    const values = [...this.dispatchStore.values()];
    return of({
      readyForOperations: this.count(values, 'READY_FOR_OPERATIONS'), preparing: this.count(values, 'PREPARING'), assigned: this.count(values, 'ASSIGNED'),
      scheduled: this.count(values, 'SCHEDULED'), readyForRoute: this.count(values, 'READY_FOR_ROUTE'), inRoute: this.count(values, 'IN_ROUTE'),
      incidents: this.count(values, 'INCIDENT'), deliveredToday: values.filter((item) => item.status === 'DELIVERED' && item.updatedAt.startsWith('2026-08-26')).length,
      temperatureAlerts: values.filter((item) => item.temperatureStatus !== 'NORMAL').length, podPending: [...this.proofStore.values()].filter((item) => item.status === 'PENDING').length,
      reservationsReady: this.count(values, 'READY_FOR_OPERATIONS')
    });
  }

  analytics(from: string, to: string): Observable<OperationalAnalytics> {
    const values = [...this.dispatchStore.values()].filter((item) => item.updatedAt >= from && item.updatedAt <= to);
    return of({ from, to, dispatches: values.length, delivered: values.filter((item) => item.status === 'DELIVERED').length, incidents: values.filter((item) => item.status === 'INCIDENT').length, temperatureExcursions: values.filter((item) => item.temperatureStatus !== 'NORMAL').length, podCompleted: [...this.proofStore.values()].filter((item) => item.status === 'COMPLETED').length, onTimeRate: values.length ? 100 : 0, averagePreparationMinutes: 18, averageRouteMinutes: 42 });
  }

  proof(status?: string): Observable<ApiPage<ProofOfDelivery>> { return of(this.page([...this.proofStore.values()].filter((item) => !status || item.status === status))); }

  prepare(item: DispatchOrder): Observable<DispatchOrder> { return this.transition(item, 'PREPARING', 'Preparación iniciada.'); }

  assign(item: DispatchOrder, payload: { responsibleMembershipId: string; vehicleReference?: string; routeName?: string }): Observable<DispatchOrder> {
    return this.operation(() => {
      const current = this.current(item);
      return this.recordStatus({ ...current, assignment: { responsibleMembershipId: payload.responsibleMembershipId, responsibleDisplayName: this.seed.assignees.find((candidate) => candidate.id === payload.responsibleMembershipId)?.displayName ?? null, vehicleReference: payload.vehicleReference ?? null, routeName: payload.routeName ?? null } }, current.status, 'ASSIGNED', 'Despacho asignado a operación.');
    });
  }

  schedule(item: DispatchOrder, payload: { deliveryWindowStart: string; deliveryWindowEnd: string; eta?: string }): Observable<DispatchOrder> {
    return this.operation(() => { const current = this.current(item); return this.recordStatus({ ...current, deliveryWindowStart: payload.deliveryWindowStart, deliveryWindowEnd: payload.deliveryWindowEnd, eta: payload.eta ?? null }, current.status, 'SCHEDULED', 'Ventana de entrega programada.'); });
  }

  ready(item: DispatchOrder): Observable<DispatchOrder> { return this.transition(item, 'READY_FOR_ROUTE', 'Despacho listo para ruta.'); }
  startRoute(item: DispatchOrder): Observable<DispatchOrder> { return this.transition(item, 'IN_ROUTE', 'Ruta iniciada.'); }

  temperature(item: DispatchOrder, payload: { value: number; unit: string; source: string }): Observable<DispatchOrder> {
    return this.operation(() => {
      const current = this.current(item);
      const normal = current.temperatureMin === null || current.temperatureMax === null || (payload.value >= current.temperatureMin && payload.value <= current.temperatureMax);
      const updated = { ...current, temperatureUnit: payload.unit, temperatureStatus: normal ? 'NORMAL' : 'EXCURSION', updatedAt: DEMO_NOW, version: current.version + 1, alerts: normal ? current.alerts : [...current.alerts, `Temperature excursion from ${payload.source}`] };
      this.dispatchStore.set(updated.id, updated);
      return updated;
    });
  }

  incident(item: DispatchOrder, payload: { type: string; severity: string; buyerVisible: boolean; description: string }): Observable<DispatchOrder> {
    return this.operation(() => { const current = this.current(item); return this.recordStatus({ ...current, alerts: [...current.alerts, `${payload.type} (${payload.severity}): ${payload.description}`] }, current.status, 'INCIDENT', payload.buyerVisible ? 'Incidente visible para buyer.' : 'Incidente interno registrado.'); });
  }

  reprogram(item: DispatchOrder, payload: { deliveryWindowStart: string; deliveryWindowEnd: string; eta?: string; reason: string }): Observable<DispatchOrder> {
    return this.operation(() => { const current = this.current(item); return this.recordStatus({ ...current, deliveryWindowStart: payload.deliveryWindowStart, deliveryWindowEnd: payload.deliveryWindowEnd, eta: payload.eta ?? null, alerts: [...current.alerts, `Reprogrammed: ${payload.reason}`] }, current.status, 'REPROGRAMMED', 'Entrega reprogramada.'); });
  }

  complete(item: DispatchOrder, payload: { receiverName: string; completedAt: string; notes?: string; photoEvidenceDeclared: boolean; signatureEvidenceDeclared: boolean }): Observable<DispatchOrder> {
    return this.operation(() => {
      const current = this.current(item);
      const updated = this.recordStatus({ ...current, podId: current.podId ?? `${current.id}-pod`, podStatus: 'COMPLETED' }, current.status, 'DELIVERED', 'Entrega completada con evidencia declarada.');
      this.proofStore.set(current.id, { podId: updated.podId, dispatchOrderId: current.id, dispatchNumber: current.dispatchNumber, status: 'COMPLETED', receiverName: payload.receiverName, completedAt: payload.completedAt, notes: payload.notes ?? null, photoEvidenceDeclared: payload.photoEvidenceDeclared, signatureEvidenceDeclared: payload.signatureEvidenceDeclared, updatedAt: DEMO_NOW });
      return updated;
    });
  }

  appendHandoffNote(item: DispatchOrder, note: string): Observable<HandoffNote> {
    return this.operation(() => {
      const current = this.current(item);
      const value: HandoffNote = { id: `${this.config.tenantProfile}-handoff-${String(this.nextHandoff++).padStart(3, '0')}`, dispatchOrderId: current.id, note, authorMembershipId: `${this.config.tenantProfile}-membership-logistics-001`, occurredAt: DEMO_NOW, dispatchVersion: current.version };
      this.handoffStore.set(current.id, [...(this.handoffStore.get(current.id) ?? []), value]);
      return value;
    });
  }

  private transition(item: DispatchOrder, status: DispatchOrder['status'], summary: string): Observable<DispatchOrder> {
    return this.operation(() => { const current = this.current(item); return this.recordStatus(current, current.status, status, summary); });
  }

  private recordStatus(item: DispatchOrder, fromStatus: string | null, status: string, summary: string): DispatchOrder {
    const updated: DispatchOrder = { ...item, status, version: item.version + 1, updatedAt: DEMO_NOW };
    this.dispatchStore.set(item.id, updated);
    const event: DispatchEvent = { id: `${item.id}-event-${String(this.nextEvent++).padStart(3, '0')}`, type: 'STATUS_CHANGED', fromStatus, toStatus: status, occurredAt: DEMO_NOW, buyerVisible: status === 'DELIVERED' || status === 'INCIDENT', summary };
    this.eventStore.set(item.id, [...(this.eventStore.get(item.id) ?? []), event]);
    return updated;
  }

  private current(item: DispatchOrder): DispatchOrder {
    const current = this.dispatchStore.get(item.id);
    if (!current) throw new Error('MOCK_DISPATCH_NOT_FOUND');
    if (current.version !== item.version) throw new Error('MOCK_DISPATCH_CONCURRENCY_CONFLICT');
    return current;
  }

  private operation<T>(fn: () => T): Observable<T> { try { return of(fn()); } catch (error) { return throwError(() => error); } }
  private required<T>(value: T | undefined, message: string): Observable<T> { return value === undefined ? throwError(() => new Error(message)) : of(value); }
  private count(values: readonly DispatchOrder[], status: string): number { return values.filter((item) => item.status === status).length; }
  private page<T>(items: readonly T[]): ApiPage<T> { return { items, page: 0, size: items.length, total: items.length }; }
}
