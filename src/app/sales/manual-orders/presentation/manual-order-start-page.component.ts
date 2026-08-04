import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { Router, RouterLink } from '@angular/router';
import { ManualOrderWizardFacade } from '../application/manual-order-wizard.facade';

@Component({
  selector: 'nexa-manual-order-start-page',
  standalone: true,
  imports: [MatButtonModule, PageHeaderComponent, RouterLink],
  template: `
    <section class="page">
      <a mat-button routerLink="/ops/commercial/purchase-requests">Volver a solicitudes</a>
      <nexa-page-header eyebrow="VENTAS" title="Nueva orden manual" subtitle="Flujo Sales de cuatro pasos, guardado en servidor." />
      <p>La orden se crea directamente como Sales Order. El servidor resolverá precios, disponibilidad, almacén, ruta y crédito.</p>
      <button mat-flat-button color="primary" type="button" [disabled]="creating()" (click)="start()">
        {{ creating() ? 'Creando borrador…' : 'Iniciar orden manual' }}
      </button>
      @if (message(); as value) { <p role="alert">{{ value }}</p> }
    </section>
  `,
  styles: [`.page{display:grid;gap:16px;max-width:900px;margin:auto;padding:32px}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualOrderStartPageComponent {
  private readonly facade = inject(ManualOrderWizardFacade);
  private readonly router = inject(Router);
  readonly creating = signal(false);
  readonly message = signal<string | null>(null);

  start(): void {
    this.creating.set(true);
    this.message.set(null);
    this.facade.createDraft().subscribe({
      next: (draft) => void this.router.navigate(['/ops/commercial/manual-orders', draft.id, 'client'], { replaceUrl: true }),
      error: () => { this.creating.set(false); this.message.set('No se pudo iniciar el borrador.'); }
    });
  }
}
