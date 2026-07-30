import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { CompanyAdministrationFacade } from '../../application/company-administration.facade';

@Component({
  selector: 'nexa-company-administration-page',
  imports: [MatButtonModule, MatCardModule, MatChipsModule, MatIconModule, ErrorStateComponent, LoadingStateComponent, PageHeaderComponent],
  templateUrl: './company-administration-page.component.html',
  styleUrl: './company-administration-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyAdministrationPageComponent {
  readonly facade = inject(CompanyAdministrationFacade);
  constructor() { this.facade.load(); }
  rename(workspaceId: string, version: number, name: string): void { this.facade.renameWorkspace(workspaceId, version, name); }
  changeRole(membershipId: string, version: number, role: string): void { this.facade.changeRole(membershipId, version, role); }
  suspend(membershipId: string, version: number): void { this.facade.suspend(membershipId, version); }
  reactivate(membershipId: string, version: number): void { this.facade.reactivate(membershipId, version); }
}
