import { inject, Injectable, signal } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { readApiProblemDetails } from '../../../core/error/api-problem-details';
import { InvitationAcceptanceCommand, InvitationAcceptanceResult } from '../domain/models/company-administration.models';
import { CompanyAdministrationApiPort } from '../domain/ports/company-administration-api.port';

@Injectable({ providedIn: 'root' })
export class InvitationAcceptanceFacade {
  private readonly api = inject(CompanyAdministrationApiPort);
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
    const problem = readApiProblemDetails(error);
    if (problem) return problem.code;
    return error instanceof Error ? error.message : 'REQUEST_FAILED';
  }
}
