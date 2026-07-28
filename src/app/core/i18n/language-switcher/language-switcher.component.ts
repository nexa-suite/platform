import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../language.service';
import { SupportedLanguage } from '../supported-language';

@Component({
  selector: 'nexa-language-switcher',
  imports: [TranslatePipe],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LanguageSwitcherComponent {
  readonly languageService = inject(LanguageService);

  onSelect(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLSelectElement) {
      this.languageService.setLanguage(target.value as SupportedLanguage);
    }
  }
}
