import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/admin-guard';
import { Register } from './pages/auth/register/register';

export const routes: Routes = [
  // Public
  { path: '', loadComponent: () => import('./pages/home/home').then(m => m.Home) },
  { path: 'login', loadComponent: () => import('./pages/auth/login/login').then(m => m.Login) },
  { path: 'register', component: Register },

  // Client (protege)
  {
    path: 'client',
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/client/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'reservation', loadComponent: () => import('./pages/client/reservation/reservation').then(m => m.Reservation) },
      { path: 'historique', loadComponent: () => import('./pages/client/historique/historique').then(m => m.Historique) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Admin (protege)
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/admin/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'espaces', loadComponent: () => import('./pages/admin/espaces/espaces').then(m => m.Espaces) },
      { path: 'reservations', loadComponent: () => import('./pages/admin/reservations/reservations').then(m => m.Reservations) },
      { path: 'utilisateurs', loadComponent: () => import('./pages/admin/utilisateurs/utilisateurs').then(m => m.Utilisateurs) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: '' }
];
