import { Injectable, inject, signal } from '@angular/core';
import { ClientAccount, ClientAccountPage } from '../domain/client-account.models';
import { SalesOperationsApiService } from '../../infrastructure/http/sales-operations-api.service';

@Injectable({ providedIn: 'root' })
export class ClientAccountsFacade {
  private readonly api = inject(SalesOperationsApiService);
  readonly state = signal<{ readonly status: 'idle'|'loading'|'success'|'empty'|'error'; readonly page: ClientAccountPage | null; readonly item: ClientAccount | null; readonly message: string | null }>({ status: 'idle', page: null, item: null, message: null });
  load(search = '', status = ''): void { this.state.update((state) => ({ ...state, status: 'loading', message: null })); this.api.clientAccounts(search, status).subscribe({ next: (page) => this.state.set({ status: page.items.length ? 'success' : 'empty', page, item: null, message: null }), error: () => this.state.update((state) => ({ ...state, status: 'error', message: 'CLIENT_ACCOUNTS_LOAD_FAILED' })) }); }
  loadDetail(id: string): void { this.state.update((state) => ({ ...state, status: 'loading', message: null })); this.api.clientAccount(id).subscribe({ next: (item) => this.state.set({ status: 'success', page: null, item, message: null }), error: () => this.state.update((state) => ({ ...state, status: 'error', message: 'CLIENT_ACCOUNT_LOAD_FAILED' })) }); }
  retry(): void { this.load(); }
}
