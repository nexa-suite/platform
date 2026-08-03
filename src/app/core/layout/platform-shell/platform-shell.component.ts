import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { BrandLogoComponent } from '../../../shared/presentation/components/brand-logo/brand-logo.component';
import { LanguageSwitcherComponent } from '../../i18n/language-switcher/language-switcher.component';
import { AuthenticationService } from '../../../iam/application/authentication.service';
import { InternalRole } from '../../../iam/domain/models/auth.models';
import { PLATFORM_NAVIGATION } from '../../navigation/navigation.registry';
import { PLATFORM_AREAS } from '../../security/platform-permissions';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';

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
  readonly currentUser = this.authentication.currentUser;
  readonly displayName = computed(() => this.currentUser()?.displayName ?? '');
  readonly navigation = computed(() => this.currentUser() ? PLATFORM_NAVIGATION.filter((item) => this.authentication.hasPermission(item.permission)) : []);
  readonly availableAreas = computed(() => (this.currentUser()?.roles ?? []).filter((role) => this.authentication.hasPermission(PLATFORM_AREAS[role].permission)));
  switchArea(role: InternalRole): void {
    const area = PLATFORM_AREAS[role];
    if (!this.currentUser()?.roles.includes(role) || !this.authentication.hasPermission(area.permission)) return;
    void this.router.navigateByUrl(area.path);
  }

  signOut(): void {
    this.authentication.signOut();
  }
}
