import { Injectable, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CompanyAdministrationState } from '../domain/models/company-administration.models';
import { CompanyAdministrationApiService } from '../infrastructure/http/company-administration-api.service';

@Injectable({ providedIn: 'root' })
export class CompanyAdministrationFacade {
  private readonly api = inject(CompanyAdministrationApiService);
  private readonly stateSignal = signal<CompanyAdministrationState>({ status: 'idle', organization: null, workspaces: [], memberships: [], message: null });
  readonly state = this.stateSignal.asReadonly();

  load(): void {
    this.stateSignal.update((state) => ({ ...state, status: 'loading', message: null }));
    forkJoin({ organization: this.api.organization(), workspaces: this.api.workspaces(), memberships: this.api.memberships() }).subscribe({
      next: (state) => this.stateSignal.set({ ...state, status: 'success', message: null }),
      error: () => this.stateSignal.update((state) => ({ ...state, status: 'error', message: 'COMPANY_ADMINISTRATION_LOAD_FAILED' }))
    });
  }

  retry(): void { this.load(); }
}
