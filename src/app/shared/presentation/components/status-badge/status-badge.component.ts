import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent';

@Component({
  selector: 'nexa-status-badge',
  host: { '[class]': "'tone-' + tone()" },
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusBadgeComponent {
  label = input.required<string>();
  tone = input<StatusTone>('neutral');
}
