import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonComponent } from '../../shared/presentation/components/button/button.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { MetricCardComponent } from '../../shared/presentation/components/metric-card/metric-card.component';
import { NexaIconComponent } from '../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { OperationalAnalyticsFacade } from '../application/operational-analytics.facade';

@Component({
  selector: 'nexa-operational-analytics-page',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, TranslatePipe, ButtonComponent, ErrorStateComponent, LoadingStateComponent,
    MetricCardComponent, NexaIconComponent, PageHeaderComponent],
  templateUrl: './operational-analytics-page.component.html',
  styleUrl: './operational-analytics-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OperationalAnalyticsPageComponent {
  readonly facade = inject(OperationalAnalyticsFacade);
  private readonly defaultTo = new Date();
  private readonly defaultFrom = new Date(this.defaultTo.getTime() - 29 * 24 * 60 * 60 * 1000);
  readonly maxDate = dateInputValue(this.defaultTo);
  readonly fromDate = signal(dateInputValue(this.defaultFrom));
  readonly toDate = signal(dateInputValue(this.defaultTo));
  readonly dateError = signal<string | null>(null);
  readonly periodInvalid = computed(() => {
    const from = this.fromDate();
    const to = this.toDate();
    return !from || !to || from > to;
  });

  constructor() { this.applyPeriod(); }

  retry(): void { this.facade.retry(); }

  setFromDate(event: Event): void {
    this.fromDate.set((event.target as HTMLInputElement).value);
    this.dateError.set(null);
  }

  setToDate(event: Event): void {
    this.toDate.set((event.target as HTMLInputElement).value);
    this.dateError.set(null);
  }

  submitPeriod(event: Event): void {
    event.preventDefault();
    this.applyPeriod();
  }

  applyPeriod(): void {
    if (this.periodInvalid()) {
      this.dateError.set('operationalAnalyticsUi.invalidDateRange');
      return;
    }
    this.dateError.set(null);
    this.facade.load(localDateTime(this.fromDate(), false), localDateTime(this.toDate(), true));
  }
}

function dateInputValue(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function localDateTime(value: string, endOfDay: boolean): string {
  return new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00'}`).toISOString();
}
