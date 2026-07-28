import { Routes } from '@angular/router';
import { PlatformShellComponent } from './core/layout/platform-shell/platform-shell.component';
import { OverviewPageComponent } from './core/presentation/overview-page/overview-page.component';

export const routes: Routes = [
  {
    path: '',
    component: PlatformShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      { path: 'overview', component: OverviewPageComponent },
      { path: '**', redirectTo: 'overview' }
    ]
  }
];
