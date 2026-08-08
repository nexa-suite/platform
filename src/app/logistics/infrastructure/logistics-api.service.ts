import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { platformApiUrl, PLATFORM_RUNTIME_CONFIG } from '../../core/security/runtime-config';
import { ApiPage, DispatchAssignee, DispatchEvent, DispatchOrder, HandoffNote, OperationalAnalytics, OperationsDashboard, ProofOfDelivery } from '../domain/logistics.models';

@Injectable({ providedIn: 'root' })
export class LogisticsApiService {
  private readonly http=inject(HttpClient); private readonly config=inject(PLATFORM_RUNTIME_CONFIG);
  private api(path:string):string{return platformApiUrl(this.config,`/api/v1${path}`);}
  private headers(version?:number):HttpHeaders{return new HttpHeaders({'If-Match':version === undefined ? '' : `"${version}"`,'Idempotency-Key':crypto.randomUUID()});}
  dispatches(status?:string):Observable<ApiPage<DispatchOrder>>{let params=new HttpParams().set('size',100).set('sort','updatedAt,desc');if(status)params=params.set('status',status);return this.http.get<ApiPage<DispatchOrder>>(this.api('/dispatch-orders'),{params});}
  assignees():Observable<readonly DispatchAssignee[]>{return this.http.get<readonly DispatchAssignee[]>(this.api('/dispatch-assignees'));}
  create(reservationId:string,version:number):Observable<DispatchOrder>{return this.http.post<DispatchOrder>(this.api(`/inventory-reservations/${encodeURIComponent(reservationId)}/dispatch-orders`),{}, {headers:this.headers(version)});}
  detail(id:string):Observable<DispatchOrder>{return this.http.get<DispatchOrder>(this.api(`/dispatch-orders/${encodeURIComponent(id)}`));}
  events(id:string):Observable<readonly DispatchEvent[]>{return this.http.get<readonly DispatchEvent[]>(this.api(`/dispatch-orders/${encodeURIComponent(id)}/events`));}
  handoffNotes(id:string):Observable<readonly HandoffNote[]>{return this.http.get<readonly HandoffNote[]>(this.api(`/dispatch-orders/${encodeURIComponent(id)}/handoff-notes`));}
  dashboard():Observable<OperationsDashboard>{return this.http.get<OperationsDashboard>(this.api('/logistics/operations-dashboard'));}
  analytics(from:string,to:string):Observable<OperationalAnalytics>{return this.http.get<OperationalAnalytics>(this.api('/logistics/operational-analytics'),{params:{from,to}});}
  proof(status?:string):Observable<ApiPage<ProofOfDelivery>>{let params=new HttpParams().set('size',100);if(status)params=params.set('status',status);return this.http.get<ApiPage<ProofOfDelivery>>(this.api('/proof-of-delivery'),{params});}
  prepare(item:DispatchOrder):Observable<DispatchOrder>{return this.http.post<DispatchOrder>(this.api(`/dispatch-orders/${item.id}/preparation-starts`),{}, {headers:this.headers(item.version)});}
  assign(item:DispatchOrder,payload:{responsibleMembershipId:string;vehicleReference?:string;routeName?:string}):Observable<DispatchOrder>{return this.http.post<DispatchOrder>(this.api(`/dispatch-orders/${item.id}/assignments`),payload,{headers:this.headers(item.version)});}
  schedule(item:DispatchOrder,payload:{deliveryWindowStart:string;deliveryWindowEnd:string;eta?:string}):Observable<DispatchOrder>{return this.http.post<DispatchOrder>(this.api(`/dispatch-orders/${item.id}/schedules`),payload,{headers:this.headers(item.version)});}
  ready(item:DispatchOrder):Observable<DispatchOrder>{return this.http.post<DispatchOrder>(this.api(`/dispatch-orders/${item.id}/route-readiness`),{}, {headers:this.headers(item.version)});}
  startRoute(item:DispatchOrder):Observable<DispatchOrder>{return this.http.post<DispatchOrder>(this.api(`/dispatch-orders/${item.id}/route-starts`),{}, {headers:this.headers(item.version)});}
  temperature(item:DispatchOrder,payload:{value:number;unit:string;source:string}):Observable<DispatchOrder>{return this.http.post<DispatchOrder>(this.api(`/dispatch-orders/${item.id}/temperature-readings`),payload,{headers:this.headers(item.version)});}
  incident(item:DispatchOrder,payload:{type:string;severity:string;buyerVisible:boolean;description:string}):Observable<DispatchOrder>{return this.http.post<DispatchOrder>(this.api(`/dispatch-orders/${item.id}/incidents`),payload,{headers:this.headers(item.version)});}
  reprogram(item:DispatchOrder,payload:{deliveryWindowStart:string;deliveryWindowEnd:string;eta?:string;reason:string}):Observable<DispatchOrder>{return this.http.post<DispatchOrder>(this.api(`/dispatch-orders/${item.id}/reprogrammings`),payload,{headers:this.headers(item.version)});}
  complete(item:DispatchOrder,payload:{receiverName:string;completedAt:string;notes?:string;photoEvidenceDeclared:boolean;signatureEvidenceDeclared:boolean}):Observable<DispatchOrder>{return this.http.post<DispatchOrder>(this.api(`/dispatch-orders/${item.id}/delivery-completions`),payload,{headers:this.headers(item.version)});}
  appendHandoffNote(item:DispatchOrder,note:string):Observable<HandoffNote>{return this.http.post<HandoffNote>(this.api(`/dispatch-orders/${item.id}/handoff-notes`),{note},{headers:this.headers(item.version)});}
}
