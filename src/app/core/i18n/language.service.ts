import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { isSupportedLanguage, SupportedLanguage } from './supported-language';

const LANGUAGE_STORAGE_KEY = 'nexa.language';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly browser = isPlatformBrowser(this.platformId);
  private readonly current = signal<SupportedLanguage>(this.initialLanguage());
  readonly currentLanguage = this.current.asReadonly();

  constructor() {
    this.translate.setFallbackLang('en');
    this.translate.use(this.current());
  }

  setLanguage(language: SupportedLanguage): void {
    this.current.set(language);
    this.translate.use(language);
    this.writeStoredLanguage(language);
  }

  private initialLanguage(): SupportedLanguage {
    const stored = this.readStoredLanguage();
    if (stored) return stored;
    const browserLanguage = this.document.defaultView?.navigator.language?.toLowerCase();
    return browserLanguage?.startsWith('es') ? 'es' : 'en';
  }

  private readStoredLanguage(): SupportedLanguage | null {
    if (!this.browser) return null;
    try {
      const value = this.document.defaultView?.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      return isSupportedLanguage(value) ? value : null;
    } catch {
      return null;
    }
  }

  private writeStoredLanguage(language: SupportedLanguage): void {
    if (!this.browser) return;
    try {
      this.document.defaultView?.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Storage is optional; language switching remains functional without it.
    }
  }
}
