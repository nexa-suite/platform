import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NexaIconComponent } from '../nexa-icon/nexa-icon.component';

export type MetricTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'nexa-metric-card',
  imports: [NexaIconComponent],
  host: { '[class]': "'tone-' + tone()" },
  templateUrl: './metric-card.component.html',
  styleUrl: './metric-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetricCardComponent {
  label = input.required<string>();
  value = input.required<string | number>();
  hint = input<string>();
  icon = input<string>();
  tone = input<MetricTone>('neutral');
}
