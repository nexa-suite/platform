import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { DEFAULT_CATALOG_FILTERS } from '../../domain/models/catalog.models';
import { MockCatalogApiService } from './mock-catalog-api.service';

describe('MockCatalogApiService', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('filters the generic deterministic catalog without HTTP', async () => {
    const service = configure('generic');
    const page = await firstValueFrom(service.search({ ...DEFAULT_CATALOG_FILTERS, q: 'butter' }));

    expect(page.totalItems).toBe(1);
    expect(page.items[0]?.id).toBe('generic-catalog-002');
    expect(page.items[0]?.image.url).toContain('/catalog-items/');
  });

  it('serves the ICISA fixture and its existing asset reference', async () => {
    const service = configure('icisa');
    const item = await firstValueFrom(service.getById('icisa-catalog-001'));

    expect(item.brand).toBe('Gestam');
    expect(item.image.fileName).toBe('gestam-queso-gouda-natural-molde-4-5kg.png');
  });

  function configure(tenantProfile: 'generic' | 'icisa'): MockCatalogApiService {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_RUNTIME_CONFIG, useValue: { apiBaseUrl: '', surface: 'PLATFORM', dataMode: 'mock', tenantProfile } },
        MockCatalogApiService
      ]
    });
    return TestBed.inject(MockCatalogApiService);
  }
});
