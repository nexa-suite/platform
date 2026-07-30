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

  renameWorkspace(workspaceId: string, version: number, name: string): void {
    this.api.updateWorkspace(workspaceId, version, { name }).subscribe({ next: (workspace) => this.stateSignal.update((state) => ({ ...state, workspaces: state.workspaces.map((item) => item.id === workspace.id ? workspace : item) })), error: () => this.stateSignal.update((state) => ({ ...state, message: 'WORKSPACE_UPDATE_FAILED' })) });
  }
  changeRole(membershipId: string, version: number, role: string): void {
    this.api.changeRole(membershipId, version, role).subscribe({ next: (membership) => this.replaceMembership(membership), error: () => this.stateSignal.update((state) => ({ ...state, message: 'MEMBERSHIP_ROLE_UPDATE_FAILED' })) });
  }
  suspend(membershipId: string, version: number): void {
    this.api.suspend(membershipId, version).subscribe({ next: (membership) => this.replaceMembership(membership), error: () => this.stateSignal.update((state) => ({ ...state, message: 'MEMBERSHIP_SUSPEND_FAILED' })) });
  }
  reactivate(membershipId: string, version: number): void {
    this.api.reactivate(membershipId, version).subscribe({ next: (membership) => this.replaceMembership(membership), error: () => this.stateSignal.update((state) => ({ ...state, message: 'MEMBERSHIP_REACTIVATE_FAILED' })) });
  }
  private replaceMembership(membership: CompanyAdministrationState['memberships'][number]): void { this.stateSignal.update((state) => ({ ...state, memberships: state.memberships.map((item) => item.id === membership.id ? membership : item) })); }
}
