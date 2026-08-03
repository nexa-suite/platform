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
import { InternalRole, isInternalRole } from '../../../iam/domain/models/auth.models';
import { PLATFORM_NAVIGATION_GROUPS } from '../../navigation/navigation.registry';
import { PLATFORM_AREAS } from '../../security/platform-permissions';
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
  readonly selectedAreaRole = signal<InternalRole | null>(null);
  readonly navigationGroups = computed(() => this.currentUser()
    ? PLATFORM_NAVIGATION_GROUPS
      .map((group) => ({ ...group, items: group.items.filter((item) => this.authentication.hasPermission(item.permission)) }))
      .filter((group) => group.items.length > 0)
    : []);
  readonly navigation = computed(() => this.navigationGroups().flatMap((group) => group.items));
  readonly availableAreas = computed(() => (this.currentUser()?.roles ?? [])
    .map((role) => ({ role, area: PLATFORM_AREAS[role] }))
    .filter(({ area }) => this.authentication.hasPermission(area.permission)));
  readonly selectedArea = computed(() => {
    const selected = this.selectedAreaRole();
    return this.availableAreas().find(({ role }) => role === selected) ?? this.availableAreas()[0] ?? null;
  });

  switchArea(value: string): void {
    if (!isInternalRole(value)) return;
    const role = value as InternalRole;
    const area = PLATFORM_AREAS[role];
    if (!this.currentUser()?.roles.includes(role) || !this.authentication.hasPermission(area.permission)) return;
    this.selectedAreaRole.set(role);
    this.closeMobileNav();
    void this.router.navigateByUrl(area.path);
  }

  toggleMobileNavigation(): void { this.mobileNavOpen.update((open) => !open); }
  closeMobileNav(): void { if (this.isMobile()) this.mobileNavOpen.set(false); }
  toggleNotifications(): void { this.notificationsOpen.update((open) => !open); }
  markNotificationsRead(): void { this.notifications.markAllRead(); }

  signOut(): void {
    this.authentication.signOut();
  }
}
