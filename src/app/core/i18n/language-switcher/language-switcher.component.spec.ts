import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from './language-switcher.component';

describe('LanguageSwitcherComponent', () => {
  let fixture: ComponentFixture<LanguageSwitcherComponent>;
  beforeEach(async () => { await TestBed.configureTestingModule({ imports: [LanguageSwitcherComponent], providers: [provideTranslateService()] }).compileComponents(); fixture = TestBed.createComponent(LanguageSwitcherComponent); fixture.detectChanges(); });
  it('provides keyboard-accessible language buttons', () => { expect(fixture.nativeElement.querySelectorAll('button')).toHaveLength(2); expect(fixture.nativeElement.querySelector('[role="group"]')).toBeTruthy(); });
});
