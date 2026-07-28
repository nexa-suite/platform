import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'nexa-brand-logo',
  templateUrl: './brand-logo.component.html',
  styleUrl: './brand-logo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BrandLogoComponent {
  variant = input<'default' | 'inverse'>('default');
  width = input<number>();
  accessibleLabel = input('Nexa');
  readonly source = computed(() => this.variant() === 'inverse' ? 'assets/branding/nexa-white.svg' : 'assets/branding/nexa.svg');
}
