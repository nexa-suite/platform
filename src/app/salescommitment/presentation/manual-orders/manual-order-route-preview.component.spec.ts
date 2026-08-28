import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { ManualOrderRoutePreviewComponent } from './manual-order-route-preview.component';
import { GoogleMapsRoutePort } from '../../domain/ports/google-maps-route.port';

describe('ManualOrderRoutePreviewComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: GoogleMapsRoutePort, useValue: { routeUrl: () => null } }],
    });
  });

  it('projects the server route and address snapshots into an operator preview', () => {
    const component = TestBed.runInInjectionContext(() => new ManualOrderRoutePreviewComponent());
    component.routeSnapshot = JSON.stringify({
      provider: 'LOCAL_DETERMINISTIC',
      reference: 'route-82',
      distanceMeters: 4300,
      durationSeconds: 840,
      previewUrl: 'https://maps.google.com/?q=route-82',
      originLatitude: -12.0785,
      originLongitude: -77.0525,
      destinationLatitude: -12.0725,
      destinationLongitude: -77.0685,
    });
    component.warehouseSnapshot = JSON.stringify({ name: 'Temporary cold-chain warehouse', address: 'Av. Arnaldo Márquez 1772' });
    component.addressSnapshot = JSON.stringify({ roadType: 'AVENUE', street: 'Av. Sucre', number: '1992' });

    expect(component.model()).toEqual({
      provider: 'LOCAL_DETERMINISTIC',
      reference: 'route-82',
      originLabel: 'Temporary cold-chain warehouse · Av. Arnaldo Márquez 1772',
      destinationLabel: 'AVENUE Av. Sucre 1992',
      distanceKm: '4.30',
      duration: '14 min',
      previewUrl: 'https://maps.google.com/?q=route-82',
      mapEmbedUrl: 'https://maps.google.com/maps?f=d&source=s_d&saddr=Av.%20Arnaldo%20M%C3%A1rquez%201772&daddr=AVENUE%20Av.%20Sucre%201992&hl=es&z=13&output=embed',
      coordinates: '-12.0785, -77.0525 → -12.0725, -77.0685',
    });
  });

  it('returns no preview for malformed route snapshots', () => {
    const component = TestBed.runInInjectionContext(() => new ManualOrderRoutePreviewComponent());
    component.routeSnapshot = '{bad-json';

    expect(component.model()).toBeNull();
  });
});
