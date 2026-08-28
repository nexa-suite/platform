import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NexaIconComponent } from '../nexa-icon/nexa-icon.component';

@Component({
  selector: 'nexa-empty-state',
  imports: [NexaIconComponent],
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
