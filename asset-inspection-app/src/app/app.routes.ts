import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'form',
    loadComponent: () =>
      import('./inspection-form/inspection-form.component').then(
        m => m.InspectionFormComponent
      ),
    canActivate: [authGuard]
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./history-component/history.component').then(
        m => m.HistoryComponent
      ),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '/login' }
];