import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AdminLoginComponent } from './pages/admin-login/admin-login.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'admin-login',
    component: AdminLoginComponent
  },
  { path: 'admin-dashboard', component: AdminDashboardComponent },
  {
    path: '**',
    redirectTo: ''
  }
];
