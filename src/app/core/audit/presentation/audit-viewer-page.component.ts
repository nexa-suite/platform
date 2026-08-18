import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { AuditApiService, AuditEvent } from '../infrastructure/audit-api.service';

@Component({
  selector: 'nexa-audit-viewer-page',
  imports: [DatePipe, JsonPipe, FormsModule, MatButtonModule, MatCardModule, TranslatePipe, PageHeaderComponent, LoadingStateComponent, ErrorStateComponent],
  template: `
    <section class="page">
      <nexa-page-header [eyebrow]="'audit.eyebrow' | translate" [title]="'audit.title' | translate" [subtitle]="'audit.subtitle' | translate" />
      @if (status() === 'loading') { <nexa-loading-state [lines]="6" [label]="'audit.loading' | translate" /> }
      @else if (status() === 'error') { <nexa-error-state [title]="'audit.errorTitle' | translate" [retryLabel]="'audit.retry' | translate" (retry)="load()" /> }
      @else {
        <mat-card class="filters"><mat-card-content><label>{{ 'audit.filters.search' | translate }}<input [ngModel]="search()" (ngModelChange)="search.set($event)" /></label><label>{{ 'audit.filters.eventType' | translate }}<input [ngModel]="eventType()" (ngModelChange)="eventType.set($event)" /></label><label>{{ 'audit.filters.workArea' | translate }}<input [ngModel]="workArea()" (ngModelChange)="workArea.set($event)" /></label></mat-card-content></mat-card>
        <mat-card><mat-card-content><table><thead><tr><th>{{ 'audit.fields.date' | translate }}</th><th>{{ 'audit.fields.event' | translate }}</th><th>{{ 'audit.fields.area' | translate }}</th><th>{{ 'audit.fields.subject' | translate }}</th><th>{{ 'audit.fields.action' | translate }}</th></tr></thead><tbody>@for (item of filtered(); track item.id) { <tr><td>{{ item.occurredAt | date:'medium' }}</td><td>{{ item.eventType }}</td><td>{{ item.actorWorkArea }}</td><td>{{ item.subjectType }} · {{ item.subjectId || '—' }}</td><td><button mat-button type="button" (click)="open(item)">{{ 'audit.actions.detail' | translate }}</button></td></tr>} @empty { <tr><td colspan="5">{{ 'audit.empty' | translate }}</td></tr> }</tbody></table></mat-card-content></mat-card>
        @if (selected(); as item) { <aside class="detail" aria-label="{{ 'audit.detail.title' | translate }}"><header><strong>{{ item.eventType }}</strong><button mat-button type="button" (click)="selected.set(null)">{{ 'audit.actions.close' | translate }}</button></header><dl><dt>{{ 'audit.fields.date' | translate }}</dt><dd>{{ item.occurredAt | date:'medium' }}</dd><dt>{{ 'audit.fields.actor' | translate }}</dt><dd>{{ item.actorMembershipId || '—' }}</dd><dt>{{ 'audit.fields.correlation' | translate }}</dt><dd>{{ item.correlationId || '—' }}</dd></dl><pre>{{ item.metadata | json }}</pre></aside> }
      }
    </section>
  `,
  styles: [`:host{display:block}.page{display:grid;gap:1rem;max-width:1200px;margin:auto;padding:2rem}.filters mat-card-content{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}.filters label{display:grid;gap:.3rem;color:#64748b;font-size:.85rem}.filters input{min-height:2.35rem;padding:.4rem;border:1px solid #cbd5e1;border-radius:.35rem;font:inherit}table{width:100%;border-collapse:collapse}th,td{padding:.7rem;text-align:left;border-bottom:1px solid #e2e8f0;vertical-align:top}.detail{display:grid;gap:.75rem;padding:1rem;border:1px solid #cbd5e1;border-radius:.5rem;background:#f8fafc}.detail header{display:flex;justify-content:space-between;gap:1rem}.detail dl{display:grid;grid-template-columns:max-content 1fr;gap:.35rem 1rem}.detail dd{margin:0}.detail pre{overflow:auto;max-height:16rem}@media(max-width:760px){.page{padding:1rem}.filters mat-card-content{grid-template-columns:1fr}table{display:block;overflow-x:auto}}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditViewerPageComponent {
  private readonly api = inject(AuditApiService);
  readonly status = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly events = signal<readonly AuditEvent[]>([]);
  readonly selected = signal<AuditEvent | null>(null);
  readonly search = signal('');
  readonly eventType = signal('');
  readonly workArea = signal('');
  readonly filtered = computed(() => {
    const search = this.search().trim().toLowerCase();
    const type = this.eventType().trim().toLowerCase();
    const area = this.workArea().trim().toLowerCase();
    return this.events().filter((item) => (!search || `${item.eventType} ${item.subjectType} ${item.subjectId ?? ''}`.toLowerCase().includes(search)) && (!type || item.eventType.toLowerCase().includes(type)) && (!area || item.actorWorkArea.toLowerCase().includes(area)));
  });

  constructor() { this.load(); }
  load(): void { this.status.set('loading'); this.api.list().subscribe({ next: (items) => { this.events.set(items); this.status.set('success'); }, error: () => this.status.set('error') }); }
  open(item: AuditEvent): void { this.selected.set(item); this.api.detail(item.id).subscribe({ next: (detail) => this.selected.set(detail), error: () => undefined }); }
}
