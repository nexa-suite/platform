import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'nexa-section-panel',
  host: { '[class.subtle]': "appearance() === 'subtle'" },
  templateUrl: './section-panel.component.html',
  styleUrl: './section-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionPanelComponent {
  private static nextId = 0;
  readonly titleId = `section-panel-title-${SectionPanelComponent.nextId++}`;
  title = input<string>();
  description = input<string>();
  appearance = input<'default' | 'subtle'>('default');
}
