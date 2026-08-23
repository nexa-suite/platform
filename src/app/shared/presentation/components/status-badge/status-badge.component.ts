import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent';
export type StatusEmphasis = 'subtle' | 'standard' | 'strong';

@Component({
  selector: 'nexa-status-badge',
  host: { '[class]': 'classes()' },
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusBadgeComponent {
  label = input.required<string>();
  tone = input<StatusTone>('neutral');
  emphasis = input<StatusEmphasis>('subtle');
  readonly classes = computed(() => `tone-${this.tone()} emphasis-${this.emphasis()}`);
}
