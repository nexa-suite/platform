import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../../shared/presentation/components/section-panel/section-panel.component';
import { PlatformAuthenticationBoundary } from '../../../core/security/platform-authentication.boundary';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';

interface CatalogHomeLink {
  readonly path: string;
  readonly icon: string;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly permission: string;
}

@Component({
  selector: 'nexa-catalog-home-page',
  imports: [NexaIconComponent, PageHeaderComponent, RouterLink, SectionPanelComponent, TranslatePipe],
  templateUrl: './catalog-home-page.component.html',
  styleUrl: './catalog-home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogHomePageComponent {
  private readonly authentication = inject(PlatformAuthenticationBoundary);
  private readonly allSections: readonly CatalogHomeLink[] = [
    { path: '/ops/catalog/products', icon: 'inventory_2', titleKey: 'catalog.navigation.products', descriptionKey: 'catalog.hub.productsDescription', permission: 'catalog:read' },
    { path: '/ops/catalog/categories', icon: 'category', titleKey: 'catalog.navigation.categories', descriptionKey: 'catalog.hub.categoriesDescription', permission: 'catalog:manage' },
    { path: '/ops/catalog/brands', icon: 'verified', titleKey: 'catalog.navigation.brands', descriptionKey: 'catalog.hub.brandsDescription', permission: 'catalog:manage' },
    { path: '/ops/catalog/pricing', icon: 'sell', titleKey: 'catalog.navigation.pricing', descriptionKey: 'catalog.hub.pricingDescription', permission: 'catalog:read' },
    { path: '/ops/catalog/promotions', icon: 'local_offer', titleKey: 'catalog.navigation.promotions', descriptionKey: 'catalog.hub.promotionsDescription', permission: 'promotion:read' }
  ];
  readonly sections = computed(() => this.allSections.filter((section) => this.authentication.hasPermission(section.permission)));
}
