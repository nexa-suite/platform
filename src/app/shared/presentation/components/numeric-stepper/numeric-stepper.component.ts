import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  selector: 'nexa-numeric-stepper',
  templateUrl: './numeric-stepper.component.html',
  styleUrl: './numeric-stepper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumericStepperComponent {
  readonly id = input.required<string>();
  readonly label = input.required<string>();
  readonly value = model(1);
  readonly min = input(0);
  readonly max = input(99);
  readonly step = input(1);
  readonly disabled = input(false);

  decrement(): void {
    this.value.update((v) => Math.max(this.min(), v - this.step()));
  }

  increment(): void {
    this.value.update((v) => Math.min(this.max(), v + this.step()));
  }
}
