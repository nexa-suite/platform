import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { CompanyAdministrationFacade } from '../../application/company-administration.facade';
import { TenantAdministrationI18n } from '../i18n/tenant-administration-i18n.service';

@Component({
  selector: 'nexa-access-plan-section',
  imports: [MatCardModule, MatChipsModule],
  templateUrl: './access-plan-section.component.html',
  styleUrl: './access-plan-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccessPlanSectionComponent {
  readonly facade = inject(CompanyAdministrationFacade);
  readonly i18n = inject(TenantAdministrationI18n);
}
