import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Observable, of, switchMap } from 'rxjs';
import { AuthenticationService } from '../../../iam/application/authentication.service';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { downloadCsv, printCurrentView } from '../../../shared/application/utilities/export.util';
import { ClientAccount } from '../../client-accounts/domain/client-account.models';
import { ProductCatalogItem } from '../../../catalog-management/domain/models/catalog.models';
import {
  CreatePurchaseRequestCommand,
  PurchaseRequestLineCommand,
  UpdatePurchaseRequestCommand,
  UpdatePurchaseRequestLineCommand
} from '../../infrastructure/http/sales-operations-api.service';
import { PaymentOption, PurchaseRequest, PurchaseRequestPriority } from '../domain/purchase-request.models';
import { RequestBuilderFacade } from '../application/request-builder.facade';

interface BuilderLine {
  readonly key: string;
  readonly id?: string;
  readonly catalogItemId: string;
  readonly itemName: string;
  readonly presentation: string;
  readonly quantity: number;
  readonly unit: string;
  readonly notes: string;
}

@Component({
  selector: 'nexa-request-builder-page',
  imports: [MatButtonModule, MatCardModule, MatChipsModule, MatFormFieldModule, MatInputModule, MatSelectModule, ReactiveFormsModule, RouterLink, TranslatePipe, PageHeaderComponent],
  templateUrl: './request-builder-page.component.html',
  styleUrl: './request-builder-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RequestBuilderPageComponent {
  readonly facade = inject(RequestBuilderFacade);
  private readonly authentication = inject(AuthenticationService);
  private readonly route = inject(ActivatedRoute);
  readonly isManual = this.route.snapshot.data['mode'] === 'manual-sales-order';
  readonly requestId = this.route.snapshot.paramMap.get('purchaseRequestId');
  readonly canWrite = computed(() => this.authentication.hasPermission('sales:write'));
  readonly currentRequest = computed(() => this.facade.state().request);
  readonly canEdit = computed(() => this.canWrite() && (!this.currentRequest() || this.currentRequest()?.status === 'DRAFT'));
  readonly lines = signal<readonly BuilderLine[]>([]);
  readonly savedRequestId = signal<string | null>(null);
  readonly lineError = signal<string | null>(null);
  private readonly seededRequestId = signal<string | null>(null);
  private newLineSequence = 0;

  readonly detailsForm = new FormGroup({
    clientAccountId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    priority: new FormControl<PurchaseRequestPriority>('NORMAL', { nonNullable: true, validators: [Validators.required] }),
    requestedDeliveryDate: new FormControl('', { nonNullable: true }),
    deliveryProfileSnapshot: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    paymentOption: new FormControl<PaymentOption>('CREDIT_LINE', { nonNullable: true, validators: [Validators.required] }),
    comment: new FormControl('', { nonNullable: true })
  });

  readonly lineForm = new FormGroup({
    catalogItemId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    quantity: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(0.01)] }),
    unit: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    notes: new FormControl('', { nonNullable: true })
  });

  constructor() {
    this.facade.loadReferences();
    if (this.requestId) this.facade.loadRequest(this.requestId);
    effect(() => {
      const request = this.facade.state().request;
      if (!request || this.seededRequestId() === request.id) return;
      this.seededRequestId.set(request.id);
      this.detailsForm.patchValue({
        clientAccountId: request.clientAccountId,
        priority: request.priority,
        requestedDeliveryDate: request.requestedDeliveryDate ?? '',
        deliveryProfileSnapshot: request.deliveryProfileSnapshot ?? '',
        paymentOption: request.paymentOption ?? 'CREDIT_LINE',
        comment: request.comment ?? ''
      });
      this.lines.set(request.lines.map((line) => ({
        key: line.id,
        id: line.id,
        catalogItemId: line.catalogItemId,
        itemName: line.itemName,
        presentation: line.presentation,
        quantity: line.quantity,
        unit: line.unit,
        notes: line.notes ?? ''
      })));
    });
  }

  clients(): readonly ClientAccount[] { return this.facade.state().clients; }
  catalogItems(): readonly ProductCatalogItem[] { return this.facade.state().catalogItems; }

  selectClient(clientId: string): void {
    const client = this.clients().find((item) => item.id === clientId);
    if (client) this.detailsForm.controls.deliveryProfileSnapshot.setValue(client.deliveryProfile);
  }

  selectCatalogItem(catalogItemId: string): void {
    const item = this.catalogItems().find((candidate) => candidate.id === catalogItemId);
    if (item) this.lineForm.controls.unit.setValue(item.presentation);
  }

  searchCatalog(query: string): void { this.facade.searchCatalog(query); }

  addLine(): void {
    if (!this.canEdit()) return;
    if (this.lineForm.invalid) { this.lineForm.markAllAsTouched(); return; }
    const value = this.lineForm.getRawValue();
    const item = this.catalogItems().find((candidate) => candidate.id === value.catalogItemId);
    if (!item) { this.lineError.set('requestBuilder.states.productRequired'); return; }
    if (this.lines().some((line) => line.catalogItemId === item.id && !line.id)) { this.lineError.set('requestBuilder.states.duplicateLine'); return; }
    this.lines.update((lines) => [...lines, {
      key: `new-${++this.newLineSequence}`,
      catalogItemId: item.id,
      itemName: item.name,
      presentation: item.presentation,
      quantity: value.quantity,
      unit: value.unit || item.presentation,
      notes: value.notes.trim()
    }]);
    this.lineError.set(null);
    this.lineForm.reset({ catalogItemId: '', quantity: 1, unit: '', notes: '' });
  }

  removeLine(key: string): void {
    if (!this.canEdit()) return;
    this.lines.update((lines) => lines.filter((line) => line.key !== key));
  }

  save(): void {
    if (!this.canEdit()) return;
    if (this.detailsForm.invalid || this.lines().length === 0) {
      this.detailsForm.markAllAsTouched();
      if (this.lines().length === 0) this.lineError.set('requestBuilder.states.lineRequired');
      return;
    }
    this.lineError.set(null);
    const details = this.detailsForm.getRawValue();
    const existing = this.currentRequest();
    if (!existing) {
      const command: CreatePurchaseRequestCommand = {
        clientAccountId: details.clientAccountId,
        priority: details.priority,
        requestedDeliveryDate: details.requestedDeliveryDate || null,
        deliveryProfileSnapshot: details.deliveryProfileSnapshot,
        paymentOption: details.paymentOption,
        comment: details.comment.trim() || null,
        lines: this.lines().map((line): PurchaseRequestLineCommand => ({
          catalogItemId: line.catalogItemId, quantity: line.quantity, unit: line.unit, notes: line.notes || null
        }))
      };
      this.facade.create(command).subscribe({ next: (request) => this.savedRequestId.set(request.id) });
      return;
    }
    const update: UpdatePurchaseRequestCommand = {
      priority: details.priority,
      requestedDeliveryDate: details.requestedDeliveryDate || null,
      deliveryProfileSnapshot: details.deliveryProfileSnapshot,
      paymentOption: details.paymentOption,
      comment: details.comment.trim() || null
    };
    this.facade.update(existing.id, existing.version, update).pipe(
      switchMap((request) => this.persistLineChanges(existing, request))
    ).subscribe({ next: (request) => this.savedRequestId.set(request.id) });
  }

  submit(): void {
    const request = this.currentRequest();
    if (request?.status === 'DRAFT' && this.canWrite()) this.facade.submit(request.id, request.version).subscribe({ next: (submitted) => this.savedRequestId.set(submitted.id) });
  }

  exportCsv(): void {
    const request = this.currentRequest();
    if (!request) return;
    downloadCsv(`nexa-${request.code}.csv`, request.lines.map((line) => ({ item: line.itemName, quantity: line.quantity, unit: line.unit, notes: line.notes ?? '' })));
  }

  print(): void { printCurrentView(); }

  mapUrl(address: string): string | null {
    const normalized = address.trim();
    return normalized ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(normalized)}` : null;
  }

  private persistLineChanges(original: PurchaseRequest, current: PurchaseRequest): Observable<PurchaseRequest> {
    const operations: Array<(request: PurchaseRequest) => Observable<PurchaseRequest>> = [];
    const currentLines = this.lines();
    const currentById = new Map(currentLines.filter((line) => line.id).map((line) => [line.id as string, line]));
    for (const line of currentLines) {
      if (!line.id) {
        operations.push((request) => this.facade.addLine(request.id, request.version, { catalogItemId: line.catalogItemId, quantity: line.quantity, unit: line.unit, notes: line.notes || null }));
        continue;
      }
      const previous = original.lines.find((candidate) => candidate.id === line.id);
      if (previous && (previous.quantity !== line.quantity || previous.notes !== (line.notes || null))) {
        const command: UpdatePurchaseRequestLineCommand = { quantity: line.quantity, notes: line.notes || null };
        operations.push((request) => this.facade.updateLine(request.id, line.id as string, request.version, command));
      }
    }
    for (const previous of original.lines) {
      if (!currentById.has(previous.id)) operations.push((request) => this.facade.deleteLine(request.id, previous.id, request.version));
    }
    return operations.reduce((stream, operation) => stream.pipe(switchMap(operation)), of(current));
  }
}
