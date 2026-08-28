import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type IconPath = readonly string[];

/** Local SVG icon registry with no runtime font or CDN dependency. */
const ICON_PATHS: Record<string, IconPath> = {
  account_balance: ['M4 10h16', 'M5 20h14', 'M7 10v7', 'M12 10v7', 'M17 10v7', 'M3 7l9-4 9 4v3H3z'],
  analytics: ['M4 19V5', 'M4 19h16', 'M7 15l3-4 3 2 5-7'],
  archive: ['M4 7h16v13H4z', 'M3 4h18v3H3z', 'M9 11h6'],
  arrow_back: ['M19 12H5', 'M11 6l-6 6 6 6'],
  arrow_forward: ['M5 12h14', 'M13 6l6 6-6 6'],
  business: ['M4 21V5h10v16', 'M14 9h6v12', 'M7 8h4', 'M7 12h4', 'M7 16h4', 'M17 13h1', 'M17 17h1'],
  cancel: ['M6 6l12 12', 'M18 6L6 18', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z'],
  category: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h6v6h-6z'],
  check: ['M5 12l4 4L19 6'],
  chat: ['M4 5h16v11H9l-5 4z', 'M8 9h8', 'M8 12h5'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  cube: ['M12 3l8 4v10l-8 4-8-4V7z', 'M12 12l8-5', 'M12 12v9', 'M12 12L4 7'],
  dashboard: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h6v6h-6z'],
  delete: ['M5 7h14', 'M10 11v6', 'M14 11v6', 'M7 7l1 14h8l1-14', 'M9 7V4h6v3'],
  edit: ['M4 20h4L19 9l-4-4L4 16v4z', 'M13 6l4 4'],
  fact_check: ['M5 4h14v16H5z', 'M8 9l1 1 2-2', 'M8 14l1 1 2-2', 'M13 9h3', 'M13 14h3'],
  filter_alt_off: ['M4 5h16l-6 7v5l-3 2v-7z', 'M4 4l16 16'],
  image: ['M4 5h16v14H4z', 'M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M4 16l4-4 3 3 3-4 6 6'],
  inventory: ['M4 6h16v14H4z', 'M7 3h10v3H7z', 'M8 10h8', 'M8 14h5'],
  inventory_2: ['M4 7h16v13H4z', 'M7 4h10v3H7z', 'M8 11h8', 'M8 15h5'],
  local_offer: ['M4 5v6l9 9 7-7-9-9H4z', 'M8 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z'],
  local_shipping: ['M3 6h11v10H3z', 'M14 10h4l3 3v3h-7z', 'M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
  lock: ['M6 10h12v10H6z', 'M8 10V7a4 4 0 0 1 8 0v3'],
  mail: ['M4 6h16v12H4z', 'M4 7l8 6 8-6'],
  logout: ['M10 5H5v14h5', 'M13 8l4 4-4 4', 'M17 12H9'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  monitoring: ['M4 19V5', 'M4 19h16', 'M7 15v-3', 'M11 15V8', 'M15 15v-5', 'M19 15V6'],
  notifications: ['M6 17h12', 'M8 17V10a4 4 0 0 1 8 0v7', 'M10 20h4', 'M5 17h14'],
  pause: ['M8 5v14', 'M16 5v14'],
  person: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21a8 8 0 0 1 16 0'],
  phone: ['M6 3h3l2 5-2 2a15 15 0 0 0 5 5l2-2 5 2v3c0 1.1-.9 2-2 2C11.3 20 4 12.7 4 4c0-1.1.9-2 2-2z'],
  play: ['M8 5l10 7-10 7z'],
  receipt_long: ['M5 3h14v18l-3-2-4 2-4-2-3 2z', 'M8 8h8', 'M8 12h8', 'M8 16h5'],
  request_quote: ['M4 5h16v14H4z', 'M8 9h8', 'M8 13h5', 'M17 3v4'],
  search: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z', 'M16.5 16.5L21 21'],
  schedule: ['M12 7v5l3 2', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z'],
  sell: ['M4 5v6l9 9 7-7-9-9H4z', 'M8 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z'],
  send: ['M3 11l18-8-8 18-2-8z', 'M11 13l10-10'],
  swap_vert: ['M8 4v16', 'M5 7l3-3 3 3', 'M16 20V4', 'M13 17l3 3 3-3'],
  thermostat: ['M10 5a2 2 0 1 1 4 0v8a4 4 0 1 1-4 0z', 'M12 11v5'],
  verified: ['M12 3l2 2 3-.2 1.2 2.8 2.5 1.8-.9 2.9.9 2.9-2.5 1.8-1.2 2.8-3-.2-2 2-2-2-3 .2-1.2-2.8-2.5-1.8.9-2.9-.9-2.9 2.5-1.8L9 4.8z', 'M8 12l2.5 2.5L16 9'],
  visibility: ['M2.5 12s3.2-5 9.5-5 9.5 5 9.5 5-3.2 5-9.5 5-9.5-5-9.5-5z', 'M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
  visibility_off: ['M3 3l18 18', 'M10.6 6.2A10.9 10.9 0 0 1 12 6c6.3 0 9.5 6 9.5 6a16.9 16.9 0 0 1-3.3 3.8', 'M6.2 6.2C3.7 8 2.5 12 2.5 12s3.2 6 9.5 6c1.5 0 2.8-.3 3.9-.8', 'M9.9 9.9a3 3 0 0 0 4.2 4.2'],
  location_on: ['M12 21s7-6.1 7-12A7 7 0 1 0 5 9c0 5.9 7 12 7 12z', 'M12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
  info: ['M12 11v5', 'M12 7h.01', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z'],
  warning: ['M12 4l9 16H3z', 'M12 9v5', 'M12 17h.01'],
  description: ['M6 3h8l4 4v14H6z', 'M14 3v5h5', 'M9 13h6', 'M9 17h6'],
  warehouse: ['M3 20V8l9-5 9 5v12H3z', 'M7 20v-6h10v6', 'M7 10h2', 'M15 10h2'],
  add: ['M12 5v14', 'M5 12h14'],
  add_circle: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 8v8', 'M8 12h8'],
  id_card: ['M4 6h16v12H4z', 'M7 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M5.5 15a3.5 3.5 0 0 1 7 0', 'M15 10h3', 'M15 14h3'],
  admin_panel_settings: ['M12 3l7 3v5c0 4.5-3 7.8-7 10-4-2.2-7-5.5-7-10V6z', 'M9 12l2 2 4-4'],
  insights: ['M4 19V5', 'M4 19h16', 'M7 15l3-5 3 3 5-7'],
  handshake: ['M4 9h4l4 3 4-3h4', 'M7 9l-3 4 5 5 3-2 3 2 5-5-3-4', 'M9 12l3 3 3-3'],
  file_check: ['M6 3h8l4 4v14H6z', 'M14 3v5h5', 'M9 15l2 2 4-4'],
  groups: ['M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M16 10a2.5 2.5 0 1 0 0-5', 'M3.5 19a4.5 4.5 0 0 1 9 0', 'M14 14a4 4 0 0 1 6.5 3'],
  inbox: ['M4 5h16v10H4z', 'M4 15h4l2 3h4l2-3h4', 'M8 9h8'],
  file_edit: ['M6 3h8l4 4v8', 'M14 3v5h5', 'M9 13h3', 'M15 15l4-4 2 2-4 4-3 1z'],
  ban: ['M7 7l10 10', 'M17 7L7 17', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z'],
  person_edit: ['M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M3.5 20a5.5 5.5 0 0 1 11 0', 'M16 13l5 5-3 3-5-5z', 'M14 16l2-2'],
  open_in_new: ['M14 5h5v5', 'M19 5l-8 8', 'M19 14v5H5V5h5'],
  playlist_add: ['M5 5h10', 'M5 10h10', 'M5 15h5', 'M18 13v7', 'M14.5 16.5h7'],
  remove: ['M5 12h14'],
  shopping_cart: ['M4 5h2l2 10h9l2-7H7', 'M10 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2z', 'M17 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2z'],
  add_shopping_cart: ['M4 5h2l2 10h9l2-7H7', 'M10 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2z', 'M17 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2z', 'M18 3v5', 'M15.5 5.5h5']
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
