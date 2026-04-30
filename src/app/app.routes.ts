import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'applications',
    pathMatch: 'full',
  },
  {
    path: 'applications',
    loadComponent: () =>
      import('./page/applications/applications.component').then(m => m.ApplicationsComponent),
  },
];
