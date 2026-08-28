import { describe, expect, it } from 'vitest';
import { GoogleMapsRouteAdapter } from './google-maps-route.adapter';

describe('GoogleMapsRouteAdapter', () => {
  const adapter = new GoogleMapsRouteAdapter();

  it('builds a keyless driving route from coordinates', () => {
    const url = adapter.routeUrl(
      { label: 'Cold warehouse', latitude: -12.0464, longitude: -77.0428 },
      { label: 'Buyer address', latitude: -11.9881, longitude: -77.0818 },
    );

    expect(url).toBe('https://www.google.com/maps/dir/?api=1&origin=-12.0464%2C-77.0428&destination=-11.9881%2C-77.0818&travelmode=driving');
  });

  it('falls back to encoded address labels and rejects incomplete routes', () => {
    const url = adapter.routeUrl(
      { label: 'Almacén', address: 'Lima, Peru' },
      { label: 'Destino', address: 'Av. Demo 123, Lima, Peru' },
    );

    expect(url).toContain('origin=Almac%C3%A9n%2C+Lima%2C+Peru');
    expect(url).toContain('destination=Destino%2C+Av.+Demo+123%2C+Lima%2C+Peru');
    expect(adapter.routeUrl({ label: 'Only origin' }, {})).toBeNull();
  });
});
