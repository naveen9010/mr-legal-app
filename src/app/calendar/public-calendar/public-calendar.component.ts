import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';

// FullCalendar imports
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventApi, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// FullCalendar styles are imported in angular.json

// Firebase imports
import { Firestore, collection, collectionData, query, where } from '@angular/fire/firestore';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-public-calendar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FullCalendarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './public-calendar.component.html',
  styleUrl: './public-calendar.component.scss'
})
export class PublicCalendarComponent implements OnInit {
  @ViewChild('calendar') calendarComponent!: ElementRef;
  
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    weekends: true,
    editable: false,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    slotMinTime: '08:00:00',
    slotMaxTime: '20:00:00',
    businessHours: {
      daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
      startTime: '09:00',
      endTime: '18:00',
    },
    events: [],
    eventClick: this.handleEventClick.bind(this),
    select: this.handleDateSelect.bind(this)
  };
  
  hearings$!: Observable<any[]>;
  consultations$!: Observable<any[]>;
  events: EventInput[] = [];
  availableSlots: EventInput[] = [];
  
  // Define business hours
  businessHoursStart = 9; // 9 AM
  businessHoursEnd = 18;  // 6 PM
  slotDuration = 60;      // 60 minutes per slot
  
  constructor(
    private firestore: Firestore,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog
  ) {}
  
  ngOnInit(): void {
    // Fetch hearings (we only need dates, not details for public view)
    const hearingsRef = collection(this.firestore, 'hearings');
    this.hearings$ = collectionData(hearingsRef, { idField: 'id' });
    
    // Fetch consultations (we only need dates, not details for public view)
    const consultationsRef = collection(this.firestore, 'consultations');
    this.consultations$ = collectionData(consultationsRef, { idField: 'id' });
    
    // Combine both observables
    combineLatest([this.hearings$, this.consultations$])
      .pipe(
        map(([hearings, consultations]) => {
          // Process hearings - for public view, we don't show details
          const hearingEvents = hearings.map(hearing => ({
            id: hearing.id,
            start: this.createDateTimeString(hearing.hearingDate, hearing.hearingTime),
            end: this.createDateTimeString(hearing.hearingDate, this.addMinutesToTime(hearing.hearingTime, 60)),
            display: 'background',
            backgroundColor: 'rgba(211, 47, 47, 0.3)', // Light red for unavailable slots
            extendedProps: {
              type: 'unavailable'
            }
          }));
          
          // Process consultations - for public view, we don't show details
          const consultationEvents = consultations.map(consultation => ({
            id: consultation.id,
            start: this.createDateTimeString(consultation.consultDate, consultation.consultTime),
            end: this.createDateTimeString(consultation.consultDate, this.addMinutesToTime(consultation.consultTime, 60)),
            display: 'background',
            backgroundColor: 'rgba(211, 47, 47, 0.3)', // Light red for unavailable slots
            extendedProps: {
              type: 'unavailable'
            }
          }));
          
          // Combine all events
          const allEvents = [...hearingEvents, ...consultationEvents];
          
          // Generate available slots
          this.generateAvailableSlots(allEvents);
          
          return allEvents;
        })
      )
      .subscribe(events => {
        this.events = events;
        this.calendarOptions.events = [...this.events, ...this.availableSlots];
      });
  }
  
  // Helper method to create a datetime string
  private createDateTimeString(date: string, time: string): string {
    return `${date}T${time}:00`;
  }
  
  // Helper method to add minutes to a time string (HH:MM)
  private addMinutesToTime(time: string, minutesToAdd: number): string {
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes + minutesToAdd;
    
    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;
    
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  }
  
  // Generate available slots
  private generateAvailableSlots(existingEvents: any[]): void {
    this.availableSlots = [];
    
    // Get the current date
    const today = new Date();
    
    // Generate slots for the next 30 days
    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      
      // Skip weekends
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // 0 = Sunday, 6 = Saturday
      
      const dateString = currentDate.toISOString().split('T')[0];
      
      // Generate slots for business hours
      for (let hour = this.businessHoursStart; hour < this.businessHoursEnd; hour++) {
        const timeString = `${hour.toString().padStart(2, '0')}:00`;
        const startDateTime = this.createDateTimeString(dateString, timeString);
        const endDateTime = this.createDateTimeString(dateString, this.addMinutesToTime(timeString, this.slotDuration));
        
        // Check if this slot conflicts with any existing events
        const hasConflict = existingEvents.some(event => {
          const eventStart = new Date(event.start).getTime();
          const eventEnd = new Date(event.end).getTime();
          const slotStart = new Date(startDateTime).getTime();
          const slotEnd = new Date(endDateTime).getTime();
          
          // Check for overlap
          return (slotStart < eventEnd && slotEnd > eventStart);
        });
        
        // If no conflict, add as available slot
        if (!hasConflict) {
          this.availableSlots.push({
            title: 'Available',
            start: startDateTime,
            end: endDateTime,
            backgroundColor: 'rgba(67, 160, 71, 0.6)', // Green for available slots
            borderColor: '#43a047',
            textColor: '#fff',
            extendedProps: {
              type: 'available',
              details: {
                date: dateString,
                time: timeString
              }
            }
          });
        }
      }
    }
  }
  
  // Handle event click
  handleEventClick(info: { event: EventApi }): void {
    const event = info.event;
    const type = event.extendedProps?.['type'];
    
    if (type === 'available') {
      const details = event.extendedProps?.['details'];
      const date = details.date;
      const time = details.time;
      
      // Show a message to the user
      this.snackBar.open(`Would you like to book a consultation on ${date} at ${time}?`, 'Book Now', {
        duration: 10000,
        panelClass: ['success-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      }).onAction().subscribe(() => {
        // Navigate to the consultation form with pre-filled date and time
        this.router.navigate(['/'], { fragment: 'book' }).then(() => {
          // Store the selected date and time in localStorage
          localStorage.setItem('selectedConsultDate', date);
          localStorage.setItem('selectedConsultTime', time);
          
          // Show a message to the user
          this.snackBar.open('Please complete the consultation form with your details', 'Close', {
            duration: 5000,
            panelClass: ['info-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        });
      });
    } else {
      this.snackBar.open('This slot is not available for booking', 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    }
  }
  
  // Handle date selection
  handleDateSelect(selectInfo: any): void {
    const start = selectInfo.startStr;
    const end = selectInfo.endStr;
    
    // Check if this is within business hours
    const startDate = new Date(start);
    const hour = startDate.getHours();
    const dayOfWeek = startDate.getDay();
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      this.snackBar.open('Weekends are not available for booking', 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }
    
    if (hour < this.businessHoursStart || hour >= this.businessHoursEnd) {
      this.snackBar.open('Please select a time during business hours (9 AM - 6 PM)', 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }
    
    // Check if this slot conflicts with any existing events
    const hasConflict = this.events.some(event => {
      const eventStart = new Date(event.start as string).getTime();
      const eventEnd = new Date(event.end as string).getTime();
      const slotStart = startDate.getTime();
      const slotEnd = new Date(end).getTime();
      
      // Check for overlap
      return (slotStart < eventEnd && slotEnd > eventStart);
    });
    
    if (hasConflict) {
      this.snackBar.open('This slot is not available for booking', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    } else {
      // Format the date and time
      const date = start.split('T')[0];
      const time = start.split('T')[1].substring(0, 5);
      
      // Show a message to the user
      this.snackBar.open(`Would you like to book a consultation on ${date} at ${time}?`, 'Book Now', {
        duration: 10000,
        panelClass: ['success-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      }).onAction().subscribe(() => {
        // Navigate to the consultation form with pre-filled date and time
        this.router.navigate(['/'], { fragment: 'book' }).then(() => {
          // Store the selected date and time in localStorage
          localStorage.setItem('selectedConsultDate', date);
          localStorage.setItem('selectedConsultTime', time);
          
          // Show a message to the user
          this.snackBar.open('Please complete the consultation form with your details', 'Close', {
            duration: 5000,
            panelClass: ['info-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        });
      });
    }
  }
}
