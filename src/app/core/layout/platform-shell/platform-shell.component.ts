import { BreakpointObserver } from '@angular/cdk/layout';
import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  EnvironmentInjector,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, of, startWith } from 'rxjs';
import { BrandLogoComponent } from '../../../shared/presentation/components/brand-logo/brand-logo.component';
import { LanguageSwitcherComponent } from '../../i18n/language-switcher/language-switcher.component';
import { PlatformAuthenticationBoundary } from '../../security/platform-authentication.boundary';
import { PLATFORM_NAVIGATION_GROUPS, PlatformNavigationItem } from '../../navigation/navigation.registry';
import { PLATFORM_AREAS, PLATFORM_PERMISSION_WORK_AREAS, PlatformWorkArea } from '../../security/platform-permissions';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PlatformNotificationsService } from '../../../notifications/application/platform-notifications.service';
import { PlatformNavigationBadgePort, PlatformNavigationBadges } from '../../navigation/platform-navigation-badge.port';

interface PlatformNavigationSection {
  readonly id: string;
  readonly labelKey: string;
  readonly items: readonly PlatformNavigationItem[];
}

@Component({
  selector: 'nexa-platform-shell',
  imports: [
    BrandLogoComponent,
    LanguageSwitcherComponent,
    MatSidenavModule,
    RouterLink,
    RouterOutlet,
    NexaIconComponent,
    TranslatePipe
  ],
  templateUrl: './platform-shell.component.html',
  styleUrl: './platform-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closeOpenLayer()'
  }
})
export class PlatformShellComponent {
  private readonly authentication = inject(PlatformAuthenticationBoundary);
  private readonly router = inject(Router);
  private readonly breakpoints = inject(BreakpointObserver);
  private readonly document = inject(DOCUMENT);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private navigationTrigger: HTMLElement | null = null;
  private notificationTrigger: HTMLElement | null = null;
  private readonly mobileNavigationClose = viewChild<ElementRef<HTMLButtonElement>>('mobileNavigationClose');
  private readonly notificationPanel = viewChild<ElementRef<HTMLElement>>('notificationPanel');
  readonly notifications = inject(PlatformNotificationsService);
  private readonly navigationBadges = inject(PlatformNavigationBadgePort, { optional: true });
  readonly navigationBadgeValues = toSignal(
    this.navigationBadges ? this.navigationBadges.values : of({} as PlatformNavigationBadges),
    { initialValue: {} as PlatformNavigationBadges }
  );
  readonly currentPath = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );
  readonly currentUser = this.authentication.currentUser;
  readonly displayName = computed(() => this.currentUser()?.displayName ?? '');
  readonly displayInitial = computed(() => this.displayName().trim().charAt(0).toLocaleUpperCase());
  readonly primaryRole = computed(() => {
    const roles = this.currentUser()?.roles ?? [];
    if (roles.includes('COMPANY_OWNER')) return 'COMPANY_OWNER' as const;
    if (roles.includes('TENANT_ADMIN')) return 'TENANT_ADMIN' as const;
    if (roles.includes('LOGISTICS')) return 'LOGISTICS' as const;
    if (roles.includes('WAREHOUSE')) return 'WAREHOUSE' as const;
    if (roles.includes('SALES')) return 'SALES' as const;
    return null;
  });
  readonly roleLabel = computed(() => {
    const role = this.primaryRole();
    return role ? `shell.roles.${role}` : 'shell.platformLabel';
  });
  readonly companyLegalName = computed(() => {
    const tenant = this.currentUser()?.tenantSlug ?? this.currentUser()?.workspaceSlug ?? '';
    if (tenant.toLowerCase() === 'icisa') return 'ICISA Distribuciones';
    return tenant ? tenant.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Nexa';
  });
  readonly companyInitials = computed(() => this.companyLegalName().trim().slice(0, 2).toUpperCase() || 'NX');
  readonly workspaceUrl = computed(() => {
    const workspace = this.currentUser()?.workspaceSlug ?? this.currentUser()?.tenantSlug ?? '';
    return workspace ? `${workspace}.nexa.com.pe` : '';
  });
  readonly workspaceContext = computed(() => {
    const user = this.currentUser();
    if (!user) return null;
    return { tenant: user.tenantSlug ?? '', workspace: user.workspaceSlug, roles: user.roleCodes ?? user.roles };
  });
  readonly isMobile = toSignal(this.breakpoints.observe('(max-width: 860px)').pipe(map((state) => state.matches)), { initialValue: false });
  readonly mobileNavOpen = signal(false);
  readonly notificationsOpen = signal(false);
  readonly selectedAreaId = signal<string | null>(null);
  readonly navigationGroups = computed(() => this.currentUser()
    ? PLATFORM_NAVIGATION_GROUPS
      .map((group) => ({ ...group, items: group.items.filter((item) => this.authentication.hasPermission(item.permission)) }))
      .filter((group) => group.items.length > 0)
    : []);
  readonly navigation = computed(() => this.navigationGroups().flatMap((group) => group.items));
  readonly navigationSections = computed<readonly PlatformNavigationSection[]>(() => {
    const groups = this.navigationGroups();
    const group = (id: string) => groups.find((candidate) => candidate.id === id)?.items ?? [];
    const commercial = group('commercial').map((item) => this.withNavigationBadge(item));
    const workspace = [
      ...commercial.filter((item) => item.path.endsWith('/dashboard')),
      ...group('catalog').map((item) => item.path === '/ops/catalog'
        ? { ...item, labelKey: 'shell.navigation.productCatalog', path: '/ops/product-catalog' }
        : item).map((item) => this.withNavigationBadge(item)),
      ...group('warehouse'),
      ...group('logistics')
    ];
    const company = [...group('administration'), ...group('finance')];
    const sections: PlatformNavigationSection[] = [
      { id: 'workspace', labelKey: 'shell.sections.workspace', items: workspace },
      { id: 'commercial', labelKey: 'shell.sections.commercial', items: commercial.filter((item) => !item.path.endsWith('/dashboard')) },
      { id: 'company', labelKey: 'shell.sections.company', items: company }
    ];
    return sections.filter((section) => section.items.length > 0);
  });
  readonly availableAreas = computed<readonly PlatformWorkArea[]>(() => {
    const user = this.currentUser();
    if (!user) return [];

    const fixedRoleAreas = user.roles
      .map((role): PlatformWorkArea | null => {
        const area = PLATFORM_AREAS[role];
        return area ? { ...area, id: role, labelKey: `shell.roles.${role}` } : null;
      })
      .filter((area): area is PlatformWorkArea => area !== null && this.authentication.hasPermission(area.permission));

    if (fixedRoleAreas.length) return fixedRoleAreas;
    return PLATFORM_PERMISSION_WORK_AREAS.filter((area) => this.authentication.hasPermission(area.permission));
  });
  readonly selectedArea = computed(() => {
    const selected = this.selectedAreaId();
    return this.availableAreas().find(({ id }) => id === selected) ?? this.availableAreas()[0] ?? null;
  });

  switchArea(value: string): void {
    const area = this.availableAreas().find((candidate) => candidate.id === value);
    if (!area || !this.authentication.hasPermission(area.permission)) return;
    this.selectedAreaId.set(area.id);
    this.closeMobileNav(false);
    void this.router.navigateByUrl(area.path);
  }

  toggleMobileNavigation(): void {
    if (this.mobileNavOpen()) {
      this.closeMobileNav();
      return;
    }

    this.navigationTrigger = this.activeElement();
    this.mobileNavOpen.set(true);
  }

  closeMobileNav(restoreFocus = true): void {
    if (!this.isMobile() || !this.mobileNavOpen()) return;
    this.mobileNavOpen.set(false);
    if (restoreFocus) this.afterRender(() => this.navigationTrigger?.focus());
  }

  handleMobileNavigationState(opened: boolean): void {
    if (!opened) return;
    const focusClose = (): void => {
      if (this.isMobile() && this.mobileNavOpen()) this.mobileNavigationClose()?.nativeElement.focus();
    };
    const view = this.document.defaultView;
    if (view) view.requestAnimationFrame(focusClose);
    else focusClose();
  }

  toggleNotifications(): void {
    if (this.notificationsOpen()) {
      this.closeNotifications();
      return;
    }

    this.notificationTrigger = this.activeElement();
    this.notificationsOpen.set(true);
    this.afterRender(() => this.notificationPanel()?.nativeElement.focus());
  }

  closeNotifications(restoreFocus = true): void {
    if (!this.notificationsOpen()) return;
    this.notificationsOpen.set(false);
    if (restoreFocus) this.afterRender(() => this.notificationTrigger?.focus());
  }

  closeOpenLayer(): void {
    if (this.notificationsOpen()) {
      this.closeNotifications();
      return;
    }
    this.closeMobileNav();
  }

  markNotificationsRead(): void { this.notifications.markAllRead(); }

  signOut(): void {
    this.authentication.signOut().subscribe({
      complete: () => void this.router.navigateByUrl('/sign-in', { replaceUrl: true }),
    });
  }

  isNavigationItemActive(path: string): boolean {
    const currentPath = this.currentPath().split(/[?#]/, 1)[0];
    const exactMatch = path === '/ops/commercial/dashboard' || path === '/ops/operations/dashboard';
    return exactMatch ? currentPath === path : currentPath === path || currentPath.startsWith(`${path}/`);
  }

  private activeElement(): HTMLElement | null {
    return this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null;
  }

  private withNavigationBadge(item: PlatformNavigationItem): PlatformNavigationItem {
    const key = item.path === '/ops/commercial/purchase-requests'
      ? 'purchaseRequests'
      : item.path === '/ops/commercial/purchase-orders'
        ? 'purchaseOrders'
        : null;
    const values = this.navigationBadgeValues();
    const badge = key ? values[key] : undefined;
    return badge && badge > 0 ? { ...item, badge } : item;
  }

  private afterRender(callback: () => void): void {
    afterNextRender(callback, { injector: this.environmentInjector });
  }
}
