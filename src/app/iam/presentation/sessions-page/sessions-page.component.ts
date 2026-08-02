import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SecurityFacade } from '../../application/security.facade';

@Component({ selector: 'nexa-sessions-page', imports: [DatePipe, TranslatePipe], templateUrl: './sessions-page.component.html', styleUrl: '../security-page/security-page.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class SessionsPageComponent {
  readonly facade = inject(SecurityFacade);
  constructor() { this.facade.loadSessions().subscribe(); }
}
