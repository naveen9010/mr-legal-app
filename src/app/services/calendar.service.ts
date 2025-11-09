import { Injectable } from '@angular/core';
import { GoogleLoginService } from './google-auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  constructor(
    private googleLogin: GoogleLoginService,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Initializes Google authentication
   * @returns Promise that resolves when authentication is complete
   */
  async initializeGoogleAuth(): Promise<boolean> {
    const token = await this.googleLogin.getOrRequestToken();
    return !!token;
  }

  /**
   * Executes the calendar functionality to create a Google Calendar event
   * with default values (used for testing)
   */
  async executeCalendarLogic(): Promise<void> {
    const token = await this.googleLogin.getOrRequestToken();
    
    if (token) {
      console.log('✅ Using existing access token');
      this.createCalendarEvent(token, {
        title: 'Hearing Appointment',
        date: '2025-06-20',
        time: '10:00',
        notes: 'Default hearing appointment'
      });
    } else {
      console.error('❌ No access token available.');
      this.snackBar.open('Failed to authenticate with Google Calendar.', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    }
  }

  /**
   * Creates a calendar event for a hearing
   * @param hearingDetails Object containing hearing details
   */
  async createHearingEvent(hearingDetails: {
    caseTitle: string;
    caseNumber: string;
    courtName: string;
    judgeName: string;
    clientName: string;
    hearingDate: string;
    hearingTime: string;
    notes: string;
  }): Promise<void> {
    // Use the existing token if available, or get a new one if needed
    const token = await this.googleLogin.getOrRequestToken();
    
    if (token) {
      console.log('✅ Using existing access token for calendar event');
      this.createCalendarEvent(token, {
        title: `Hearing: ${hearingDetails.caseTitle} (${hearingDetails.caseNumber})`,
        date: hearingDetails.hearingDate,
        time: hearingDetails.hearingTime,
        notes: `Court: ${hearingDetails.courtName}\nJudge: ${hearingDetails.judgeName}\nClient: ${hearingDetails.clientName}\nNotes: ${hearingDetails.notes}`
      });
    } else {
      console.error('❌ No access token available.');
      this.snackBar.open('Failed to authenticate with Google Calendar. Please log out and log in again.', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    }
  }

  private createCalendarEvent(token: string, eventDetails: {
    title: string;
    date: string;
    time: string;
    notes?: string;
  }): void {
    // Parse date and time
    const [year, month, day] = eventDetails.date.split('-').map(Number);
    const [hours, minutes] = eventDetails.time.split(':').map(Number);
    
    // Create start and end times (assuming 1 hour duration)
    const startDate = new Date(year, month - 1, day, hours, minutes);
    const endDate = new Date(year, month - 1, day, hours + 1, minutes);
    
    // Format for API
    const startDateTime = startDate.toISOString().replace('Z', '+05:30');
    const endDateTime = endDate.toISOString().replace('Z', '+05:30');
    
    const event = {
      summary: eventDetails.title,
      description: eventDetails.notes || '',
      start: {
        dateTime: startDateTime,
        timeZone: 'Asia/Kolkata'
      },
      end: {
        dateTime: endDateTime,
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
      this.snackBar.open('Event added to your calendar!', 'Close', {
        duration: 5000,
        panelClass: ['success-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    })
    .catch(err => {
      console.error('❌ Error creating event:', err);
      this.snackBar.open('Calendar event creation failed.', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    });
  }
}
