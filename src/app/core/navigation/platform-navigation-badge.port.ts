import { Observable } from 'rxjs';

export type PlatformNavigationBadges = Readonly<Record<string, number>>;

/** Optional read-only badge feed consumed by the platform shell. */
export abstract class PlatformNavigationBadgePort {
  abstract readonly values: Observable<PlatformNavigationBadges>;
}
