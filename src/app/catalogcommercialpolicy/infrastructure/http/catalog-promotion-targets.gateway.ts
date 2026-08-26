import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { platformApiUrl, PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { CatalogPromotionTargetOption } from '../../domain/models/catalog-promotion-target.models';
import { CatalogPromotionTargetsPort } from '../../domain/ports/catalog-promotion-targets.port';

type ApiRecord = Readonly<Record<string, unknown>>;

interface ClientAccountPageDto extends ApiRecord {
  readonly items?: readonly ApiRecord[];
}

/**
 * BC-03 adapter for the existing client-account target endpoint. The
 * endpoint remains owned by Customer & Buyer Relationships; this gateway
 * translates only the promotion option shape required by Catalog.
 */
@Injectable({ providedIn: 'root' })
export class CatalogPromotionTargetsGateway implements CatalogPromotionTargetsPort {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);

  list(): Observable<readonly CatalogPromotionTargetOption[]> {
    const params = new HttpParams().set('page', 0).set('size', 100);
    return this.http.get<ClientAccountPageDto>(this.api('/client-accounts'), { params }).pipe(
      map((response) => (response.items ?? []).map((item) => this.toTarget(item)))
    );
  }

  private toTarget(value: ApiRecord): CatalogPromotionTargetOption {
    return {
      id: this.stringValue(value, 'clientAccountId', 'id'),
      code: this.stringValue(value, 'clientAccountCode', 'code'),
      businessName: this.stringValue(value, 'businessName', 'legalName'),
      commercialName: this.stringValue(value, 'commercialName', 'tradeName')
    };
  }

  private stringValue(value: ApiRecord, ...keys: string[]): string {
    for (const key of keys) {
      const candidate = value[key];
      if (typeof candidate === 'string') return candidate;
    }
    return '';
  }

  private api(path: string): string { return platformApiUrl(this.config, `/api/v1${path}`); }
}
