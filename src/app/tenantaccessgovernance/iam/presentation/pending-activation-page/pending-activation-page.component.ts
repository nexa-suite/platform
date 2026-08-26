import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { concat, interval, of } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SecurityFacade } from '../../application/security.facade';

export const PENDING_STATUS_POLL_INTERVAL_MS = 5_000;

@Component({ selector: 'nexa-pending-activation-page', imports: [TranslatePipe], templateUrl: './pending-activation-page.component.html', styleUrl: '../security-page/security-page.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class PendingActivationPageComponent {
  readonly facade = inject(SecurityFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly registrationId = this.route.snapshot.paramMap.get('registrationId');
  private readonly statusToken = this.route.snapshot.queryParamMap.get('statusToken');

  constructor() {
    this.removeStatusTokenFromUrl();
    this.startPolling();
  }

  private removeStatusTokenFromUrl(): void {
    if (!this.statusToken) return;

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { statusToken: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  private startPolling(): void {
    const registrationId = this.registrationId;
    const statusToken = this.statusToken;
    if (!registrationId || !statusToken) return;

    concat(of(undefined), interval(PENDING_STATUS_POLL_INTERVAL_MS)).pipe(
      switchMap(() => this.facade.loadRegistration(registrationId, statusToken)),
      takeWhile((registration) => registration.status === 'PENDING_ACTIVATION', true),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({ error: () => undefined });
  }
}
