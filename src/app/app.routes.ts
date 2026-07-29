import { Routes } from '@angular/router';
import { internalRoleGuard } from './core/security/internal-role.guard';
import { anonymousGuard, authGuard } from './core/security/auth.guard';
import { platformSurfaceGuard } from './core/security/platform-surface.guard';
import { PlatformShellComponent } from './core/layout/platform-shell/platform-shell.component';
import { OverviewPageComponent } from './core/presentation/overview-page/overview-page.component';
import { ForbiddenPageComponent } from './iam/presentation/forbidden-page/forbidden-page.component';
import { SignInPageComponent } from './iam/presentation/sign-in-page/sign-in-page.component';
import { INTERNAL_ROLES } from './iam/domain/models/auth.models';
import { ProductCatalogPageComponent } from './catalog-management/presentation/product-catalog-page/product-catalog-page.component';
import { ProductCatalogDetailPageComponent } from './catalog-management/presentation/product-catalog-detail-page/product-catalog-detail-page.component';

const catalogRoles = INTERNAL_ROLES;

export const routes: Routes = [
  { path: 'sign-in', component: SignInPageComponent, canActivate: [anonymousGuard] },
  { path: 'forbidden', component: ForbiddenPageComponent },
  {
    path: '',
    component: PlatformShellComponent,
    canActivate: [platformSurfaceGuard, authGuard],
    data: { surface: 'PLATFORM' },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'ops/overview' },
      { path: 'ops/overview', component: OverviewPageComponent },
      { path: 'ops/product-catalog', component: ProductCatalogPageComponent, canActivate: [internalRoleGuard(catalogRoles)], data: { roles: catalogRoles } },
      { path: 'ops/product-catalog/:catalogItemId', component: ProductCatalogDetailPageComponent, canActivate: [internalRoleGuard(catalogRoles)], data: { roles: catalogRoles } },
      { path: 'overview', pathMatch: 'full', redirectTo: 'ops/overview' },
      { path: 'ops/catalog', pathMatch: 'full', redirectTo: 'ops/product-catalog' },
      { path: '**', redirectTo: 'ops/overview' }
    ]
  }
];
