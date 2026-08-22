import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

interface RoutePreviewModel {
  readonly provider: string;
  readonly reference: string;
  readonly originLabel: string;
  readonly destinationLabel: string;
  readonly distanceKm: string;
  readonly duration: string;
  readonly previewUrl: string | null;
  readonly coordinates: string;
}

@Component({
  selector: 'nexa-manual-order-route-preview',
  standalone: true,
  imports: [MatButtonModule],
  template: `
    @if (model(); as route) {
      <section class="route-preview" aria-labelledby="manual-route-preview-title">
        <div class="route-preview-header">
          <div>
            <p>RUTA DE ENTREGA</p>
            <h3 id="manual-route-preview-title">Mapa y servicio</h3>
          </div>
          <span class="status-pill">{{ route.provider }}</span>
        </div>
        <div class="route-map" role="img" [attr.aria-label]="'Ruta desde ' + route.originLabel + ' hasta ' + route.destinationLabel">
          <div class="route-node origin"><strong>Origen</strong><span>{{ route.originLabel }}</span></div>
          <span class="route-connector" aria-hidden="true"></span>
          <div class="route-node destination"><strong>Destino</strong><span>{{ route.destinationLabel }}</span></div>
        </div>
        <dl class="route-metrics">
          <div><dt>Distancia</dt><dd>{{ route.distanceKm }} km</dd></div>
          <div><dt>Duración</dt><dd>{{ route.duration }}</dd></div>
          <div><dt>Coordenadas</dt><dd>{{ route.coordinates }}</dd></div>
        </dl>
        <div class="route-preview-actions">
          <p class="route-helper">Referencia {{ route.reference }} · el cálculo y la selección de almacén vienen del servidor.</p>
          @if (route.previewUrl; as url) {
            <a mat-stroked-button [href]="url" target="_blank" rel="noopener noreferrer">Abrir ruta</a>
          }
        </div>
      </section>
    }
  `,
  styleUrl: './manual-order-route-preview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualOrderRoutePreviewComponent {
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
    return {
      provider: this.routeProvider || stringValue(route, 'provider') || 'ROUTE_PREVIEW',
      reference: stringValue(route, 'reference') || 'snapshot',
      originLabel,
      destinationLabel,
      distanceKm: distanceKm ? distanceKm.toFixed(2) : '—',
      duration: durationSeconds ? formatDuration(durationSeconds) : '—',
      previewUrl: stringValue(route, 'previewUrl') || null,
      coordinates: coordinates(route),
    };
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
