import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PLATFORM_ROUTES } from '../../../../core/routing/route-paths';
import { firstPermittedPlatformLanding } from '../../../../core/security/platform-permissions';
import { AuthenticationService } from '../../application/authentication.service';
import { NexaIconComponent } from '../../../../shared/presentation/components/nexa-icon/nexa-icon.component';

const FORBIDDEN_REASONS = ['SURFACE_NOT_ALLOWED', 'ROLE_NOT_ASSIGNED', 'PERMISSION_NOT_GRANTED', 'SESSION_ACCESS_CHANGED'] as const;
type ForbiddenReason = (typeof FORBIDDEN_REASONS)[number];

@Component({
  selector: 'nexa-forbidden-page',
  imports: [MatButtonModule, MatCardModule, NexaIconComponent, RouterLink, TranslatePipe],
  templateUrl: './forbidden-page.component.html',
  styleUrl: './forbidden-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForbiddenPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly authentication = inject(AuthenticationService);
  protected readonly reason = computed<ForbiddenReason>(() => {
    const value = this.route.snapshot.queryParamMap.get('reason');
    return FORBIDDEN_REASONS.includes(value as ForbiddenReason) ? value as ForbiddenReason : 'PERMISSION_NOT_GRANTED';
  });
  protected readonly reasonKey = computed(() => `auth.forbidden.reasons.${this.reason()}`);
  protected readonly overviewRoute = computed(() => {
    return firstPermittedPlatformLanding(this.authentication.hasPermission)?.path ?? PLATFORM_ROUTES.landing;
  });
}
