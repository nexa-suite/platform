import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
import { AuthenticationService } from '../../../iam/application/authentication.service';
import { PLATFORM_NAVIGATION_GROUPS } from '../../navigation/navigation.registry';
import { PLATFORM_AREAS, PLATFORM_PERMISSION_WORK_AREAS, PlatformWorkArea } from '../../security/platform-permissions';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PlatformNotificationsService } from '../../notifications/platform-notifications.service';

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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlatformShellComponent {
  private readonly authentication = inject(AuthenticationService);
  private readonly router = inject(Router);
  private readonly breakpoints = inject(BreakpointObserver);
  readonly notifications = inject(PlatformNotificationsService);
  readonly currentUser = this.authentication.currentUser;
  readonly displayName = computed(() => this.currentUser()?.displayName ?? '');
  readonly workspaceContext = computed(() => {
    const user = this.currentUser();
    if (!user) return null;
    return { tenant: user.tenantSlug ?? '', workspace: user.workspaceSlug, roles: user.roleCodes ?? user.roles };
  });
  readonly isMobile = toSignal(this.breakpoints.observe('(max-width: 760px)').pipe(map((state) => state.matches)), { initialValue: false });
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
    this.closeMobileNav();
    void this.router.navigateByUrl(area.path);
  }

  toggleMobileNavigation(): void { this.mobileNavOpen.update((open) => !open); }
  closeMobileNav(): void { if (this.isMobile()) this.mobileNavOpen.set(false); }
  toggleNotifications(): void { this.notificationsOpen.update((open) => !open); }
  markNotificationsRead(): void { this.notifications.markAllRead(); }

  signOut(): void {
    this.authentication.signOut().subscribe({
      complete: () => void this.router.navigateByUrl('/sign-in', { replaceUrl: true }),
    });
  }
}
