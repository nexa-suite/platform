import { Observable } from 'rxjs';
import { CatalogPromotionTargetOption } from '../models/catalog-promotion-target.models';

export abstract class CatalogPromotionTargetsPort {
  abstract list(): Observable<readonly CatalogPromotionTargetOption[]>;
}
