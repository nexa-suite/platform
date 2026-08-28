import { Injectable } from '@angular/core';
import { GoogleMapsRouteLocation, GoogleMapsRoutePort } from '../../domain/ports/google-maps-route.port';

const GOOGLE_MAPS_BASE_URL = 'https://www.google.com/maps/dir/?api=1';

/** Infrastructure adapter. It opens Google Maps without requiring an API key. */
@Injectable({ providedIn: 'root' })
export class GoogleMapsRouteAdapter implements GoogleMapsRoutePort {
  routeUrl(origin: GoogleMapsRouteLocation, destination: GoogleMapsRouteLocation): string | null {
    const originValue = locationValue(origin);
    const destinationValue = locationValue(destination);
    if (!originValue || !destinationValue) return null;

    const params = new URLSearchParams({
      origin: originValue,
      destination: destinationValue,
      travelmode: 'driving',
    });
    return `${GOOGLE_MAPS_BASE_URL}&${params.toString()}`;
  }
}

function locationValue(location: GoogleMapsRouteLocation): string {
  const coordinates = [location.latitude, location.longitude]
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
    .join(',');
  return coordinates || [location.label, location.address]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(', ')
    .trim();
}
