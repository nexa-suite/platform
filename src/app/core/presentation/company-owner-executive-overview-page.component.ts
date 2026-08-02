import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';

/** Read-only Company Owner landing assembled from the already available projections. */
@Component({
  selector: 'nexa-company-owner-executive-overview',
  imports: [PageHeaderComponent],
  template: `
    <section class="owner-overview">
      <nexa-page-header eyebrow="Company Owner" title="Executive overview" subtitle="Read-only business health for this workspace" />
      <div class="overview-grid">
        @for (card of cards; track card.title) {
          <article class="overview-card"><p class="card-label">{{ card.title }}</p><strong>{{ card.value }}</strong><p>{{ card.description }}</p></article>
        }
      </div>
      <article class="overview-card"><h2>Recent business activity</h2><p>Activity is read from the existing change feed for the authorized workspace.</p></article>
    </section>
  `,
  styles: [`:host{display:block}.owner-overview{display:grid;gap:var(--nexa-space-8)}.overview-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:var(--nexa-space-4)}.overview-card{display:grid;gap:var(--nexa-space-2);padding:var(--nexa-space-5);border:1px solid var(--nexa-color-border);border-radius:var(--nexa-radius-lg);background:var(--nexa-color-surface)}.overview-card p{color:var(--nexa-color-text-secondary);margin:0}.card-label{font-size:.8rem;text-transform:uppercase;letter-spacing:.06em}`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyOwnerExecutiveOverviewPageComponent {
  readonly cards = [
    { title: 'Sales overview', value: 'Read-only', description: 'Sales dashboard projection.' },
    { title: 'Purchase Request summary', value: 'Read-only', description: 'Purchase request projection.' },
    { title: 'Sales Order summary', value: 'Read-only', description: 'Sales order projection.' },
    { title: 'Client Account summary', value: 'Read-only', description: 'Client account projection.' },
    { title: 'Inventory overview', value: 'Read-only', description: 'Inventory projection.' },
    { title: 'Warehouse summary', value: 'Read-only', description: 'Warehouse projection.' },
    { title: 'Dispatch summary', value: 'Read-only', description: 'Dispatch projection.' }
  ] as const;
}
