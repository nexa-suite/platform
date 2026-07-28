import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  imports: [MatCardModule, MatIconModule, MatListModule, MatSidenavModule, MatToolbarModule, RouterOutlet, TranslatePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly translate = inject(TranslateService);
  protected readonly selectedLanguage = signal<'en' | 'es'>('en');
  protected readonly contexts = [
    'shell.contexts.iam',
    'shell.contexts.tenantManagement',
    'shell.contexts.catalogManagement',
    'shell.contexts.sales',
    'shell.contexts.warehouse',
    'shell.contexts.logistics',
    'shell.contexts.invoicing'
  ];

  protected changeLanguage(language: string): void {
    const nextLanguage = language === 'es' ? 'es' : 'en';
    this.selectedLanguage.set(nextLanguage);
    this.translate.use(nextLanguage);
  }
}
