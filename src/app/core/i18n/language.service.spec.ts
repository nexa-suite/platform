import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  beforeEach(() => {
    globalThis.localStorage?.removeItem('nexa.language');
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
  });

  it('defaults to English and changes supported language', () => {
    const service = TestBed.inject(LanguageService);
    expect(service.currentLanguage()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    service.setLanguage('es');
    expect(service.currentLanguage()).toBe('es');
    expect(document.documentElement.lang).toBe('es');
  });

  it('falls back to English when browser storage is unavailable', () => {
    expect(TestBed.inject(LanguageService).currentLanguage()).toBe('en');
  });
});
