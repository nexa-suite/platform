import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'nexa-surface',
  templateUrl: './surface.component.html',
  styleUrl: './surface.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SurfaceComponent {
  readonly tone = input<'default' | 'soft' | 'inset'>('default');
}
