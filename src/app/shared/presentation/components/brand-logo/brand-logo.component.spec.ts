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

  it('supports the Design Lab primary alias and decorative contract', () => {
    fixture.componentRef.setInput('variant', 'primary');
    fixture.componentRef.setInput('decorative', true);
    fixture.detectChanges();

    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(image.src).toContain('assets/branding/nexa.svg');
    expect(image.alt).toBe('');
    expect(image.getAttribute('aria-hidden')).toBe('true');
  });

  it('selects the inverse canonical asset', () => {
    fixture.componentRef.setInput('variant', 'inverse');
    fixture.detectChanges();

    expect((fixture.nativeElement.querySelector('img') as HTMLImageElement).src).toContain('assets/branding/nexa-white.svg');
  });
});
