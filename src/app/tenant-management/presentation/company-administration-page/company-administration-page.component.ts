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
import { TenantAdministrationI18n } from '../i18n/tenant-administration-i18n.service';

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
  readonly i18n = inject(TenantAdministrationI18n);
  readonly tab = signal<AdministrationTab>('overview');
  readonly tabs: readonly { readonly id: AdministrationTab; readonly labelKey: string }[] = [
    { id: 'overview', labelKey: 'overview' },
    { id: 'organization', labelKey: 'organizationTab' },
    { id: 'team', labelKey: 'teamTab' },
    { id: 'settings', labelKey: 'settingsTab' },
    { id: 'access', labelKey: 'accessTab' }
  ];
  readonly technicalReadOnly = computed(() => !this.facade.canManageWorkspace() && !this.facade.canManageRoleDefinitions() && !this.facade.canManageSecurity());
  /** Compatibility alias retained for host integrations; the page is not business-read-only for Company Owner. */
  readonly readOnly = this.technicalReadOnly;

  constructor() { this.facade.load(); }
  selectTab(tab: AdministrationTab): void { this.tab.set(tab); }
  friendlyMessage(value: string | null): string { return this.i18n.error(value); }
  localizedNotice(value: string | null): string { return value ? this.i18n.notice(value) : ''; }
}
