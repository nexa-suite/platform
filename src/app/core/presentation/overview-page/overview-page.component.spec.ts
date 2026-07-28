import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { OverviewPageComponent } from './overview-page.component';

describe('OverviewPageComponent', () => {
  let fixture: ComponentFixture<OverviewPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverviewPageComponent],
      providers: [provideTranslateService()]
    }).compileComponents();
    fixture = TestBed.createComponent(OverviewPageComponent);
    fixture.detectChanges();
  });

  it('renders the reusable page foundations', () => {
    expect(fixture.nativeElement.querySelector('nexa-page-header')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('nexa-section-panel')).toBeTruthy();
  });
});
