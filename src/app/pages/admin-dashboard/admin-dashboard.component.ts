// src/app/components/admin-dashboard/admin-dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { HearingScheduleComponent } from '../hearing-schedule/hearing-schedule.component';
import { CommonModule } from '@angular/common';
import { ReminderService } from '../../services/reminder.service';
import { NotificationService } from '../../services/notification.service'; // ✅ Import this
import { environment } from '../../../environments/environment.prod';

@Component({
  selector: 'app-admin-dashboard',
  imports: [HearingScheduleComponent, CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  constructor(
    private reminderService: ReminderService,
    private notificationService: NotificationService // ✅ Inject this
  ) {}

  ngOnInit() {
    // ✅ Always request permission & store FCM token for Admin
    if (this.isBrowser()) {
      this.notificationService.requestPermissionAndTokenForAdmin();
    }

    // ✅ Optional: Run checkHearingsAndNotify() only in development
    if (!environment.production && this.isBrowser()) {
      if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            console.log('Notification permission granted ✅');
            this.reminderService.checkHearingsAndNotify();
          } else {
            console.warn('Notification permission denied ❌');
          }
        });
      } else if (Notification.permission === 'granted') {
        this.reminderService.checkHearingsAndNotify();
      }
    } else {
      console.log('[AdminDashboardComponent] Skipping test notifications logic');
    }
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined';
  }

  logout(): void {
  localStorage.removeItem('adminEmail');
  window.location.href = '/'; // Redirect to Home page
  }

}
