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
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { BrandLogoComponent } from '../../../shared/presentation/components/brand-logo/brand-logo.component';
import { LanguageSwitcherComponent } from '../../i18n/language-switcher/language-switcher.component';
import { PlatformAuthenticationBoundary } from '../../security/platform-authentication.boundary';
import { PLATFORM_NAVIGATION_GROUPS } from '../../navigation/navigation.registry';
import { PLATFORM_AREAS, PLATFORM_PERMISSION_WORK_AREAS, PlatformWorkArea } from '../../security/platform-permissions';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PlatformNotificationsService } from '../../../notifications/application/platform-notifications.service';

@Component({
  selector: 'nexa-platform-shell',
  imports: [
    BrandLogoComponent,
    LanguageSwitcherComponent,
    MatButtonModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
    RouterLink,
    RouterLinkActive,
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
  readonly currentUser = this.authentication.currentUser;
  readonly displayName = computed(() => this.currentUser()?.displayName ?? '');
  readonly displayInitial = computed(() => this.displayName().trim().charAt(0).toLocaleUpperCase());
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

  private activeElement(): HTMLElement | null {
    return this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null;
  }

  private afterRender(callback: () => void): void {
    afterNextRender(callback, { injector: this.environmentInjector });
  }
}
