import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrandLogoComponent } from './brand-logo.component';

describe('BrandLogoComponent', () => {
  let fixture: ComponentFixture<BrandLogoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BrandLogoComponent] }).compileComponents();
    fixture = TestBed.createComponent(BrandLogoComponent);
    fixture.detectChanges();
  });

  it('uses the local brand asset and accessible label', () => {
    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(image.src).toContain('assets/branding/nexa.svg');
    expect(image.alt).toBe('Nexa');
  });
});
