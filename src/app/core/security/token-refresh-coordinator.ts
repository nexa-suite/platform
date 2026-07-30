import { Injectable, inject } from '@angular/core';
import { Observable, finalize, shareReplay } from 'rxjs';
import { AuthenticationService } from '../../iam/application/authentication.service';

@Injectable({ providedIn: 'root' })
export class TokenRefreshCoordinator {
  private readonly authentication = inject(AuthenticationService);
  private inFlight: Observable<string> | null = null;

  refresh(): Observable<string> {
    if (!this.inFlight) {
      this.inFlight = this.authentication.refreshAccessToken().pipe(
        finalize(() => { this.inFlight = null; }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return this.inFlight;
  }
}
