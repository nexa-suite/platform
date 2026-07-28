import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';

@Component({
  selector: 'nexa-error-state',
  templateUrl: './error-state.component.html',
  styleUrl: './error-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorStateComponent {
  title = input.required<string>();
  description = input<string>();
  retryLabel = input('Retry');
  showRetry = input(true);
  retry = output<void>();
  private retryEmitted = false;

  constructor() {
    effect(() => { if (!this.showRetry()) this.retryEmitted = false; });
  }

  onRetry(): void {
    if (this.retryEmitted) return;
    this.retryEmitted = true;
    this.retry.emit();
  }
}
