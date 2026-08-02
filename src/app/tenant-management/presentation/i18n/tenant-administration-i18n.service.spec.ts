import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageService } from '../../../core/i18n/language.service';
import { TenantAdministrationI18n } from './tenant-administration-i18n.service';

describe('TenantAdministrationI18n', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideTranslateService()] }));

  it('switches tenant administration labels between English and Spanish', () => {
    const i18n = TestBed.inject(TenantAdministrationI18n);
    const language = TestBed.inject(LanguageService);
    language.setLanguage('en');
    expect(i18n.t('pageTitle')).toBe('Company administration');
    language.setLanguage('es');
    expect(i18n.t('pageTitle')).toBe('Administración de compañía');
  });
});
