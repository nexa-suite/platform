import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ColdChainVariant = 'refrigerated' | 'frozen' | 'ambient' | 'risk';

@Component({
  selector: 'nexa-cold-chain-badge',
  host: { '[class]': "'variant-' + variant()" },
  templateUrl: './cold-chain-badge.component.html',
  styleUrl: './cold-chain-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColdChainBadgeComponent {
  label = input.required<string>();
  variant = input<ColdChainVariant>('ambient');
}
