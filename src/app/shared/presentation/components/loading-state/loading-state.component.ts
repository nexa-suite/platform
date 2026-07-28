import { ChangeDetectionStrategy, Component, computed, input, numberAttribute } from '@angular/core';

@Component({
  selector: 'nexa-loading-state',
  templateUrl: './loading-state.component.html',
  styleUrl: './loading-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingStateComponent {
  lines = input(3, { transform: numberAttribute });
  label = input('Loading');
  compact = input(false);
  readonly placeholders = computed(() => Array.from({ length: Math.max(1, this.lines()) }, (_, index) => index));
}
