import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';
import { GoogleMapsRoutePort } from '../../domain/ports/google-maps-route.port';

interface RoutePreviewModel {
  readonly provider: string;
  readonly reference: string;
  readonly originLabel: string;
  readonly destinationLabel: string;
  readonly distanceKm: string;
  readonly duration: string;
  readonly previewUrl: string | null;
  readonly mapEmbedUrl: string | null;
  readonly coordinates: string;
}

@Component({
  selector: 'nexa-manual-order-route-preview',
  standalone: true,
  imports: [MatButtonModule, TranslatePipe],
  template: `
    @if (model(); as route) {
      <section class="route-preview" aria-labelledby="manual-route-preview-title">
        <div class="route-preview-header">
          <div>
            <p>{{ 'requestBuilder.route.kicker' | translate }}</p>
            <h3 id="manual-route-preview-title">{{ 'requestBuilder.route.title' | translate }}</h3>
          </div>
          <span class="status-pill">{{ route.provider }}</span>
        </div>
        @if (route.mapEmbedUrl; as mapUrl) {
          <iframe
            class="route-map-embed"
            [src]="trustedMapUrl(mapUrl)"
            [title]="'requestBuilder.route.aria' | translate: { origin: route.originLabel, destination: route.destinationLabel }"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          ></iframe>
        } @else {
          <div class="route-map" role="img" [attr.aria-label]="'requestBuilder.route.aria' | translate: { origin: route.originLabel, destination: route.destinationLabel }">
            <div class="route-node origin"><strong>{{ 'requestBuilder.route.origin' | translate }}</strong><span>{{ route.originLabel }}</span></div>
            <span class="route-connector" aria-hidden="true"></span>
            <div class="route-node destination"><strong>{{ 'requestBuilder.route.destination' | translate }}</strong><span>{{ route.destinationLabel }}</span></div>
          </div>
        }
        <dl class="route-metrics">
          <div><dt>{{ 'requestBuilder.route.distance' | translate }}</dt><dd>{{ route.distanceKm }} km</dd></div>
          <div><dt>{{ 'requestBuilder.route.duration' | translate }}</dt><dd>{{ route.duration }}</dd></div>
          <div><dt>{{ 'requestBuilder.route.coordinates' | translate }}</dt><dd>{{ route.coordinates }}</dd></div>
        </dl>
        <div class="route-preview-actions">
          <p class="route-helper">{{ 'requestBuilder.route.serverSource' | translate: { reference: route.reference } }}</p>
          @if (route.previewUrl; as url) {
            <a mat-stroked-button [href]="url" target="_blank" rel="noopener noreferrer">{{ 'requestBuilder.actions.openMap' | translate }}</a>
          }
        </div>
      </section>
    }
  `,
  styleUrl: './manual-order-route-preview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualOrderRoutePreviewComponent {
  private readonly maps = inject(GoogleMapsRoutePort);
  private readonly sanitizer = inject(DomSanitizer);
  private trustedMapUrlCache: { readonly source: string; readonly value: SafeResourceUrl } | null = null;
  @Input() routeSnapshot: string | null = null;
  @Input() warehouseSnapshot: string | null = null;
  @Input() addressSnapshot: string | null = null;
  @Input() routeProvider: string | null = null;

  model(): RoutePreviewModel | null {
    const route = parse(this.routeSnapshot);
    if (!route) return null;
    const warehouse = parse(this.warehouseSnapshot);
    const address = parse(this.addressSnapshot);
    const originAddress = stringValue(warehouse, 'address');
    const destinationAddress = [stringValue(address, 'roadType'), stringValue(address, 'street'), stringValue(address, 'number')]
      .filter(Boolean).join(' ');
    const originLabel = [stringValue(warehouse, 'name'), originAddress].filter(Boolean).join(' · ')
      || stringValue(route, 'originLabel') || 'Almacén operativo';
    const destinationLabel = destinationAddress || stringValue(route, 'destinationLabel') || 'Dirección de entrega';
    const distanceMeters = numberValue(route, 'distanceMeters');
    const distanceKm = numberValue(route, 'distanceKm') || (distanceMeters ? distanceMeters / 1000 : 0);
    const durationSeconds = numberValue(route, 'durationSeconds');
    const generatedPreviewUrl = this.maps.routeUrl(
      { label: stringValue(warehouse, 'name'), address: originAddress, latitude: numberOrNull(route, 'originLatitude'), longitude: numberOrNull(route, 'originLongitude') },
      { label: destinationLabel, address: destinationAddress, latitude: numberOrNull(route, 'destinationLatitude'), longitude: numberOrNull(route, 'destinationLongitude') },
    );
    const mapOrigin = originAddress || stringValue(warehouse, 'name') || originLabel;
    const mapDestination = destinationAddress || destinationLabel;
    const mapEmbedUrl = mapOrigin && mapDestination
      ? `https://maps.google.com/maps?f=d&source=s_d&saddr=${encodeURIComponent(mapOrigin)}&daddr=${encodeURIComponent(mapDestination)}&hl=es&z=13&output=embed`
      : null;
    return {
      provider: this.routeProvider || stringValue(route, 'provider') || 'ROUTE_PREVIEW',
      reference: stringValue(route, 'reference') || 'snapshot',
      originLabel,
      destinationLabel,
      distanceKm: distanceKm ? distanceKm.toFixed(2) : '—',
      duration: durationSeconds ? formatDuration(durationSeconds) : '—',
      previewUrl: stringValue(route, 'previewUrl') || generatedPreviewUrl,
      mapEmbedUrl,
      coordinates: coordinates(route),
    };
  }

  trustedMapUrl(source: string): SafeResourceUrl {
    if (this.trustedMapUrlCache?.source === source) return this.trustedMapUrlCache.value;
    const value = this.sanitizer.bypassSecurityTrustResourceUrl(source);
    this.trustedMapUrlCache = { source, value };
    return value;
  }
}

function parse(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function stringValue(value: Record<string, unknown> | null, key: string): string {
  const item = value?.[key];
  return item == null ? '' : String(item);
}

function numberValue(value: Record<string, unknown> | null, key: string): number {
  const item = Number(value?.[key]);
  return Number.isFinite(item) ? item : 0;
}

function numberOrNull(value: Record<string, unknown> | null, key: string): number | null {
  const number = numberValue(value, key);
  return number === 0 ? null : number;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} s`;
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

function coordinates(route: Record<string, unknown> | null): string {
  const origin = [stringValue(route, 'originLatitude'), stringValue(route, 'originLongitude')].filter(Boolean).join(', ');
  const destination = [stringValue(route, 'destinationLatitude'), stringValue(route, 'destinationLongitude')].filter(Boolean).join(', ');
  return origin && destination ? `${origin} → ${destination}` : 'No disponibles';
}
