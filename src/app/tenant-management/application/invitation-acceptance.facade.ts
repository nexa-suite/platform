import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { InvitationAcceptanceCommand, InvitationAcceptanceResult } from '../domain/models/company-administration.models';
import { CompanyAdministrationApiService } from '../infrastructure/http/company-administration-api.service';

@Injectable({ providedIn: 'root' })
export class InvitationAcceptanceFacade {
  private readonly api = inject(CompanyAdministrationApiService);
  private readonly busySignal = signal(false);
  private readonly resultSignal = signal<InvitationAcceptanceResult | null>(null);
  private readonly errorSignal = signal<string | null>(null);

  readonly busy = this.busySignal.asReadonly();
  readonly result = this.resultSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  accept(command: InvitationAcceptanceCommand): Observable<InvitationAcceptanceResult> {
    this.busySignal.set(true);
    this.resultSignal.set(null);
    this.errorSignal.set(null);
    return this.api.acceptInvitation(command).pipe(
      tap((result) => this.resultSignal.set(result)),
      catchError((error: unknown) => {
        this.errorSignal.set(this.errorCode(error));
        return EMPTY;
      }),
      finalize(() => this.busySignal.set(false))
    );
  }

  private errorCode(error: unknown): string {
    if (error instanceof HttpErrorResponse) return String(error.error?.code ?? `HTTP_${error.status}`);
    return error instanceof Error ? error.message : 'REQUEST_FAILED';
  }
}
