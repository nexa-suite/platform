import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'nexa-page-header',
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input<string>();
  eyebrow = input<string>();
}
