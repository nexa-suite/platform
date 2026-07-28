import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'nexa-section-panel',
  host: { '[class.subtle]': "appearance() === 'subtle'" },
  templateUrl: './section-panel.component.html',
  styleUrl: './section-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionPanelComponent {
  title = input<string>();
  description = input<string>();
  appearance = input<'default' | 'subtle'>('default');
}
