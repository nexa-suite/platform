import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'nexa-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  title = input.required<string>();
  description = input<string>();
  icon = input<string>();
  compact = input(false);
}
