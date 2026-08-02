import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SecurityFacade } from '../../application/security.facade';

@Component({ selector: 'nexa-pending-activation-page', imports: [TranslatePipe], templateUrl: './pending-activation-page.component.html', styleUrl: '../security-page/security-page.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class PendingActivationPageComponent {
  readonly facade = inject(SecurityFacade);
  constructor() { const route = inject(ActivatedRoute); const id = route.snapshot.paramMap.get('registrationId'); const token = route.snapshot.queryParamMap.get('statusToken'); if (id && token) this.facade.loadRegistration(id, token).subscribe(); }
}
