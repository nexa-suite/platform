import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type IconPath = readonly string[];

/** Local SVG icon registry with no runtime font or CDN dependency. */
const ICON_PATHS: Record<string, IconPath> = {
  analytics: ['M4 19V5', 'M4 19h16', 'M7 15l3-4 3 2 5-7'],
  archive: ['M4 7h16v13H4z', 'M3 4h18v3H3z', 'M9 11h6'],
  arrow_back: ['M19 12H5', 'M11 6l-6 6 6 6'],
  arrow_forward: ['M5 12h14', 'M13 6l6 6-6 6'],
  business: ['M4 21V5h10v16', 'M14 9h6v12', 'M7 8h4', 'M7 12h4', 'M7 16h4', 'M17 13h1', 'M17 17h1'],
  cancel: ['M6 6l12 12', 'M18 6L6 18', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z'],
  category: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h6v6h-6z'],
  check: ['M5 12l4 4L19 6'],
  dashboard: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h6v6h-6z'],
  edit: ['M4 20h4L19 9l-4-4L4 16v4z', 'M13 6l4 4'],
  fact_check: ['M5 4h14v16H5z', 'M8 9l1 1 2-2', 'M8 14l1 1 2-2', 'M13 9h3', 'M13 14h3'],
  filter_alt_off: ['M4 5h16l-6 7v5l-3 2v-7z', 'M4 4l16 16'],
  image: ['M4 5h16v14H4z', 'M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M4 16l4-4 3 3 3-4 6 6'],
  inventory: ['M4 6h16v14H4z', 'M7 3h10v3H7z', 'M8 10h8', 'M8 14h5'],
  inventory_2: ['M4 7h16v13H4z', 'M7 4h10v3H7z', 'M8 11h8', 'M8 15h5'],
  local_offer: ['M4 5v6l9 9 7-7-9-9H4z', 'M8 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z'],
  local_shipping: ['M3 6h11v10H3z', 'M14 10h4l3 3v3h-7z', 'M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
  lock: ['M6 10h12v10H6z', 'M8 10V7a4 4 0 0 1 8 0v3'],
  logout: ['M10 5H5v14h5', 'M13 8l4 4-4 4', 'M17 12H9'],
  monitoring: ['M4 19V5', 'M4 19h16', 'M7 15v-3', 'M11 15V8', 'M15 15v-5', 'M19 15V6'],
  pause: ['M8 5v14', 'M16 5v14'],
  play: ['M8 5l10 7-10 7z'],
  receipt_long: ['M5 3h14v18l-3-2-4 2-4-2-3 2z', 'M8 8h8', 'M8 12h8', 'M8 16h5'],
  request_quote: ['M4 5h16v14H4z', 'M8 9h8', 'M8 13h5', 'M17 3v4'],
  sell: ['M4 5v6l9 9 7-7-9-9H4z', 'M8 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z'],
  send: ['M3 11l18-8-8 18-2-8z', 'M11 13l10-10'],
  swap_vert: ['M8 4v16', 'M5 7l3-3 3 3', 'M16 20V4', 'M13 17l3 3 3-3'],
  thermostat: ['M10 5a2 2 0 1 1 4 0v8a4 4 0 1 1-4 0z', 'M12 11v5'],
  verified: ['M12 3l2 2 3-.2 1.2 2.8 2.5 1.8-.9 2.9.9 2.9-2.5 1.8-1.2 2.8-3-.2-2 2-2-2-3 .2-1.2-2.8-2.5-1.8.9-2.9-.9-2.9 2.5-1.8L9 4.8z', 'M8 12l2.5 2.5L16 9'],
  warehouse: ['M3 20V8l9-5 9 5v12H3z', 'M7 20v-6h10v6', 'M7 10h2', 'M15 10h2'],
  add: ['M12 5v14', 'M5 12h14']
};

@Component({
  selector: 'nexa-icon',
  standalone: true,
  template: `
    <svg class="nexa-icon" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      @for (path of paths(); track path) { <path [attr.d]="path" /> }
    </svg>
  `,
  styles: [`
    :host { display: inline-flex; width: 1.5rem; height: 1.5rem; flex: 0 0 auto; vertical-align: middle; }
    .nexa-icon { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NexaIconComponent {
  readonly name = input('check');
  readonly paths = computed(() => ICON_PATHS[this.name()] ?? ICON_PATHS['check']);
}
