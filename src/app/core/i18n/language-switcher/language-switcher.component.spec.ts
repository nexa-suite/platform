import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from './language-switcher.component';

describe('LanguageSwitcherComponent', () => {
  let fixture: ComponentFixture<LanguageSwitcherComponent>;
  beforeEach(async () => { await TestBed.configureTestingModule({ imports: [LanguageSwitcherComponent], providers: [provideTranslateService()] }).compileComponents(); fixture = TestBed.createComponent(LanguageSwitcherComponent); fixture.detectChanges(); });
  it('provides keyboard-accessible language selection', () => { expect(fixture.nativeElement.querySelector('select')).toBeTruthy(); expect(fixture.nativeElement.querySelector('label')).toBeTruthy(); });
});
