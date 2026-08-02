import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { CompanyAdministrationFacade } from '../../application/company-administration.facade';
import { AccessPlanSectionComponent } from './access-plan-section.component';
import { OrganizationWorkspacesSectionComponent } from './organization-workspaces-section.component';
import { SettingsSectionComponent } from './settings-section.component';
import { TeamInvitationsSectionComponent } from './team-invitations-section.component';

type AdministrationTab = 'overview' | 'organization' | 'team' | 'settings' | 'access';

@Component({
  selector: 'nexa-company-administration-page',
  imports: [AccessPlanSectionComponent, MatButtonModule, MatCardModule, ErrorStateComponent, LoadingStateComponent, OrganizationWorkspacesSectionComponent, PageHeaderComponent, SettingsSectionComponent, TeamInvitationsSectionComponent],
  templateUrl: './company-administration-page.component.html',
  styleUrl: './company-administration-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyAdministrationPageComponent {
  readonly facade = inject(CompanyAdministrationFacade);
  readonly tab = signal<AdministrationTab>('overview');
  readonly tabs: readonly { readonly id: AdministrationTab; readonly label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'organization', label: 'Organization & workspaces' },
    { id: 'team', label: 'Team & invitations' },
    { id: 'settings', label: 'Settings' },
    { id: 'access', label: 'Access & plan' }
  ];
  readonly readOnly = computed(() => !this.facade.canManage());

  constructor() { this.facade.load(); }
  selectTab(tab: AdministrationTab): void { this.tab.set(tab); }
  friendlyMessage(value: string | null): string { return value ? value.replaceAll('_', ' ') : ''; }
}
