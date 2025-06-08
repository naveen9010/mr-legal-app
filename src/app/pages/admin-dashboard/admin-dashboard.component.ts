import { Component, OnInit } from '@angular/core';
import { HearingScheduleComponent } from '../hearing-schedule/hearing-schedule.component';
import { CommonModule } from '@angular/common';
import { ReminderService } from '../../services/reminder.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [HearingScheduleComponent, CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  constructor(private reminderService: ReminderService) {}

  ngOnInit() {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notification permission granted ✅');
          // 🟢 Call reminder logic here!
          this.reminderService.checkHearingsAndNotify();
        } else {
          console.warn('Notification permission denied ❌');
        }
      });
    } else if (Notification.permission === 'granted') {
      // If already granted → directly call it
      this.reminderService.checkHearingsAndNotify();
    }
  }
}