export interface GoogleMapsRouteLocation {
  readonly label?: string | null;
  readonly address?: string | null;
  readonly latitude?: number | null;
  readonly longitude?: number | null;
}

/**
 * BC-04 outbound port for opening a delivery route in an external map
 * provider. The domain/application layer does not depend on Google APIs.
 */
export abstract class GoogleMapsRoutePort {
  abstract routeUrl(origin: GoogleMapsRouteLocation, destination: GoogleMapsRouteLocation): string | null;
}
