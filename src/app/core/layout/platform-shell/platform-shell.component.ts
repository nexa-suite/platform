import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { BrandLogoComponent } from '../../../shared/presentation/components/brand-logo/brand-logo.component';
import { LanguageSwitcherComponent } from '../../i18n/language-switcher/language-switcher.component';
import { AuthenticationService } from '../../../iam/application/authentication.service';
import { INTERNAL_ROLES, InternalRole } from '../../../iam/domain/models/auth.models';
import { PLATFORM_NAVIGATION } from '../../navigation/navigation.registry';

@Component({
  selector: 'nexa-platform-shell',
  imports: [
    BrandLogoComponent,
    LanguageSwitcherComponent,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    TranslatePipe
  ],
  templateUrl: './platform-shell.component.html',
  styleUrl: './platform-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlatformShellComponent {
  private readonly authentication = inject(AuthenticationService);
  private readonly router = inject(Router);
  readonly currentUser = this.authentication.currentUser;
  readonly displayName = computed(() => this.currentUser()?.displayName ?? '');
  readonly navigation = computed(() => PLATFORM_NAVIGATION.filter((item) => {
    const user = this.currentUser();
    if (!user) return false;
    return (!item.permission || user.permissions.includes(item.permission)) && (!item.roles || item.roles.some((role) => user.roles.includes(role as never)));
  }));
  switchArea(role: InternalRole): void {
    if (!this.currentUser()?.roles.includes(role)) return;
    void this.router.navigateByUrl(AREA_PATHS[INTERNAL_ROLES.indexOf(role)]);
  }

  signOut(): void {
    this.authentication.signOut();
  }
}

const AREA_PATHS = ['/ops/operations/company-administration', '/ops/executive-overview', '/ops/commercial/dashboard', '/ops/operations/dashboard', '/ops/operations/dispatch-orders'];
