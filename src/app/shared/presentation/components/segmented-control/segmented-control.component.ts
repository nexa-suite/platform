import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface NexaSegmentOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export type NexaSegmentedSize = 'compact' | 'standard';

@Component({
  selector: 'nexa-segmented-control',
  templateUrl: './segmented-control.component.html',
  styleUrl: './segmented-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentedControlComponent {
  readonly label = input.required<string>();
  readonly options = input.required<readonly NexaSegmentOption[]>();
  readonly selected = model.required<string>();
  readonly size = input<NexaSegmentedSize>('standard');

  choose(option: NexaSegmentOption): void {
    if (!option.disabled) {
      this.selected.set(option.value);
    }
  }
}
