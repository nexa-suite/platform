import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { CatalogPromotionTargetOption } from '../../domain/models/catalog-promotion-target.models';
import { CatalogPromotionTargetsPort } from '../../domain/ports/catalog-promotion-targets.port';

@Injectable({ providedIn: 'root' })
export class MockCatalogPromotionTargetsGateway implements CatalogPromotionTargetsPort {
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);
  list(): Observable<readonly CatalogPromotionTargetOption[]> { const icisa = this.config.tenantProfile === 'icisa'; return of([{ id: `${this.config.tenantProfile}-client-001`, code: icisa ? 'ICISA-001' : 'GEN-001', businessName: icisa ? 'ICISA S.A.C.' : 'Generic Demo Buyer S.A.C.', commercialName: icisa ? 'ICISA' : 'Generic Buyer' }, { id: `${this.config.tenantProfile}-client-002`, code: icisa ? 'ICISA-002' : 'GEN-002', businessName: icisa ? 'Frío Andino S.A.C.' : 'Generic Retail S.A.C.', commercialName: icisa ? 'Frío Andino' : 'Generic Retail' }]); }
}
