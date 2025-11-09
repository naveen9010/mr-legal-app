import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AdminLoginComponent } from './pages/admin-login/admin-login.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { CalendarComponent } from './calendar/calendar.component';
import { EnhancedCalendarComponent } from './calendar/enhanced-calendar/enhanced-calendar.component';
import { PublicCalendarComponent } from './calendar/public-calendar/public-calendar.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'admin-login', component: AdminLoginComponent },
  { path: 'admin-dashboard', component: AdminDashboardComponent },
  { path: 'calendar', component: CalendarComponent },
  { path: 'enhanced-calendar', component: EnhancedCalendarComponent },
  { path: 'available-slots', component: PublicCalendarComponent },
  { path: '**', redirectTo: '' }
];
