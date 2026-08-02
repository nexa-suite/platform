import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthenticationService } from '../../application/authentication.service';
import { SecurityFacade } from '../../application/security.facade';
import { ActiveSession } from '../../domain/security.models';

@Component({ selector: 'nexa-sessions-page', imports: [DatePipe, TranslatePipe], templateUrl: './sessions-page.component.html', styleUrl: '../security-page/security-page.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class SessionsPageComponent {
  readonly facade = inject(SecurityFacade);
  private readonly authentication = inject(AuthenticationService);
  private readonly router = inject(Router);
  constructor() { this.facade.loadSessions().subscribe(); }

  revoke(session: ActiveSession): void {
    this.facade.revokeSession(session.sessionId).subscribe({
      next: () => {
        if (session.current) {
          this.authentication.expireSession();
          void this.router.navigateByUrl('/sign-in');
        }
      },
    });
  }
}
