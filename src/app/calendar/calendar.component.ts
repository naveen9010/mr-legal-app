import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleLoginService } from '../services/google-auth.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent implements OnInit {
  constructor(private googleLogin: GoogleLoginService) {}

  ngOnInit(): void {
    const clientId = '611773104435-bge1nsjpqd8g0g1u5nd8bmvm1m1ehdk3.apps.googleusercontent.com';
    const scope = 'https://www.googleapis.com/auth/calendar.events';

    this.googleLogin.requestAccessToken(clientId, scope, (token: string | null) => {
      if (token) {
        console.log('✅ Access Token received:', token);
        this.createCalendarEvent(token);
      } else {
        console.error('❌ No access token received.');
        alert('Failed to authenticate with Google Calendar.');
      }
    });
  }

  createCalendarEvent(token: string): void {
    const event = {
      summary: 'Hearing Appointment',
      start: {
        dateTime: '2025-06-20T10:00:00+05:30',
        timeZone: 'Asia/Kolkata'
      },
      end: {
        dateTime: '2025-06-20T11:00:00+05:30',
        timeZone: 'Asia/Kolkata'
      }
    };

    fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    })
    .then(res => res.json())
    .then(data => {
      console.log('✅ Event Created:', data);
      alert('Event added to your calendar!');
    })
    .catch(err => {
      console.error('❌ Error creating event:', err);
      alert('Calendar event creation failed.');
    });
  }
}
