import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BrandLogoVariant = 'default' | 'primary' | 'inverse';

@Component({
  selector: 'nexa-brand-logo',
  templateUrl: './brand-logo.component.html',
  styleUrl: './brand-logo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BrandLogoComponent {
  /** `default` remains the Platform alias; Design Lab calls it `primary`. */
  variant = input<BrandLogoVariant>('default');
  width = input<number>();
  accessibleLabel = input('Nexa');
  decorative = input(false);
  readonly source = computed(() => this.variant() === 'inverse' ? 'assets/branding/nexa-white.svg' : 'assets/branding/nexa.svg');
}
