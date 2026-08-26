import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { signal } from '@angular/core';
import { PlatformAuthenticationBoundary } from '../../../core/security/platform-authentication.boundary';
import { describe, expect, it } from 'vitest';
import { CatalogHomePageComponent } from './catalog-home-page.component';

describe('CatalogHomePageComponent', () => {
  let fixture: ComponentFixture<CatalogHomePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogHomePageComponent],
      providers: [provideRouter([]), provideTranslateService(), { provide: PlatformAuthenticationBoundary, useValue: { currentUser: signal(null), hasPermission: () => true } }]
    }).compileComponents();
    fixture = TestBed.createComponent(CatalogHomePageComponent);
    fixture.detectChanges();
  });

  it('exposes the five catalog management sections through the canonical routes', () => {
    const links = [...fixture.nativeElement.querySelectorAll('.catalog-link')] as HTMLAnchorElement[];

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/ops/catalog/products',
      '/ops/catalog/categories',
      '/ops/catalog/brands',
      '/ops/catalog/pricing',
      '/ops/catalog/promotions'
    ]);
  });
});
