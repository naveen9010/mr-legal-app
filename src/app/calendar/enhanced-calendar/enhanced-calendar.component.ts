import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { PremiumLoaderComponent } from '../../components/premium-loader/premium-loader.component';

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

// Define event types
interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  color: string;
  extendedProps: {
    type: 'hearing' | 'consultation' | 'available';
    details: any;
  };
}

@Component({
  selector: 'app-enhanced-calendar',
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
    MatTooltipModule,
    MatSelectModule,
    PremiumLoaderComponent
  ],
  templateUrl: './enhanced-calendar.component.html',
  styleUrl: './enhanced-calendar.component.scss'
})
export class EnhancedCalendarComponent implements OnInit {
  @ViewChild('calendar') calendarComponent!: ElementRef;
  isLoading = true;
  
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
    select: this.handleDateSelect.bind(this),
    eventDidMount: this.handleEventRender.bind(this)
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
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    // Fetch hearings
    const hearingsRef = collection(this.firestore, 'hearings');
    this.hearings$ = collectionData(hearingsRef, { idField: 'id' });
    
    // Fetch consultations
    const consultationsRef = collection(this.firestore, 'consultations');
    this.consultations$ = collectionData(consultationsRef, { idField: 'id' });
    
    // Combine both observables
    combineLatest([this.hearings$, this.consultations$])
      .pipe(
        map(([hearings, consultations]) => {
          // Process hearings
          const hearingEvents = hearings.map(hearing => ({
            id: hearing.id,
            title: `Hearing: ${hearing.caseTitle}`,
            start: this.createDateTimeString(hearing.hearingDate, hearing.hearingTime),
            end: this.createDateTimeString(hearing.hearingDate, this.addMinutesToTime(hearing.hearingTime, 60)),
            color: '#1976d2', // Blue for hearings
            extendedProps: {
              type: 'hearing',
              details: hearing
            }
          }));
          
          // Process consultations
          const consultationEvents = consultations.map(consultation => ({
            id: consultation.id,
            title: `Consultation: ${consultation.clientName}`,
            start: this.createDateTimeString(consultation.consultDate, consultation.consultTime),
            end: this.createDateTimeString(consultation.consultDate, this.addMinutesToTime(consultation.consultTime, 60)),
            color: '#43a047', // Green for consultations
            extendedProps: {
              type: 'consultation',
              details: consultation
            }
          }));
          
          // Combine all events
          const allEvents = [...hearingEvents, ...consultationEvents];
          
          // Generate available slots
          this.generateAvailableSlots(allEvents);
          
          // Check for conflicts
          this.checkForConflicts(allEvents);
          
          return allEvents;
        })
      )
      .subscribe(events => {
        this.events = events;
        this.calendarOptions.events = [...this.events, ...this.availableSlots];
        this.isLoading = false;
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
            color: '#8bc34a', // Light green for available slots
            extendedProps: {
              type: 'available',
              details: {
                date: dateString,
                time: timeString
              }
            },
            display: 'background'
          });
        }
      }
    }
  }
  
  // Check for conflicts between events
  private checkForConflicts(events: any[]): void {
    // Create a copy of events to avoid modifying the original array
    const eventsToCheck = [...events];
    
    // Check each event against all others
    for (let i = 0; i < eventsToCheck.length; i++) {
      const event1 = eventsToCheck[i];
      const event1Start = new Date(event1.start).getTime();
      const event1End = new Date(event1.end).getTime();
      
      for (let j = i + 1; j < eventsToCheck.length; j++) {
        const event2 = eventsToCheck[j];
        const event2Start = new Date(event2.start).getTime();
        const event2End = new Date(event2.end).getTime();
        
        // Check for overlap
        if (event1Start < event2End && event1End > event2Start) {
          // Mark both events as having conflicts
          event1.color = '#d32f2f'; // Red for conflicts
          event2.color = '#d32f2f'; // Red for conflicts
          
          // Add conflict information to extended props
          event1.extendedProps.hasConflict = true;
          event2.extendedProps.hasConflict = true;
          
          // Add reference to the conflicting event
          if (!event1.extendedProps.conflicts) event1.extendedProps.conflicts = [];
          if (!event2.extendedProps.conflicts) event2.extendedProps.conflicts = [];
          
          event1.extendedProps.conflicts.push(event2.id);
          event2.extendedProps.conflicts.push(event1.id);
        }
      }
    }
  }
  
  // Handle event click
  handleEventClick(info: { event: EventApi }): void {
    this.isLoading = true;
    const event = info.event;
    const type = event.extendedProps?.['type'];
    const details = event.extendedProps?.['details'];
    
    if (type === 'available') {
      this.snackBar.open('This slot is available for booking', 'Close', {
        duration: 3000,
        panelClass: ['info-snackbar']
      });
    } else {
      let message = '';
      
      if (type === 'hearing') {
        message = `Hearing Details:\nCase: ${details.caseTitle}\nClient: ${details.clientName}\nDate: ${details.hearingDate}\nTime: ${details.hearingTime}`;
      } else if (type === 'consultation') {
        message = `Consultation Details:\nClient: ${details.clientName}\nDate: ${details.consultDate}\nTime: ${details.consultTime}`;
      }
      
      if (event.extendedProps?.['hasConflict']) {
        message += '\n\nWARNING: This event conflicts with another appointment!';
      }
      
      this.snackBar.open(message, 'Close', {
        duration: 5000,
        panelClass: [event.extendedProps?.['hasConflict'] ? 'warning-snackbar' : 'info-snackbar']
      });
    }
    
    this.isLoading = false;
  }
  
  // Handle date selection
  handleDateSelect(selectInfo: any): void {
    this.isLoading = true;
    const start = selectInfo.startStr;
    const end = selectInfo.endStr;
    
    // Check if this is within business hours
    const startDate = new Date(start);
    const hour = startDate.getHours();
    const dayOfWeek = startDate.getDay();
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      this.snackBar.open('Weekends are not available for booking', 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      this.isLoading = false;
      return;
    }
    
    if (hour < this.businessHoursStart || hour >= this.businessHoursEnd) {
      this.snackBar.open('Please select a time during business hours (9 AM - 6 PM)', 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      this.isLoading = false;
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
      this.snackBar.open('This slot conflicts with an existing appointment', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      this.isLoading = false;
    } else {
      this.snackBar.open('This slot is available for booking', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
      
      // Here you could open a dialog to book this slot
      this.isLoading = false;
    }
  }
  
  // Custom event rendering
  handleEventRender(info: any): void {
    const event = info.event;
    const element = info.el;
    
    // Add tooltip
    if (event.extendedProps?.type !== 'available') {
      element.setAttribute('title', event.title);
      
      // Add conflict indicator
      if (event.extendedProps?.['hasConflict']) {
        const conflictIndicator = document.createElement('div');
        conflictIndicator.className = 'conflict-indicator';
        conflictIndicator.innerHTML = '⚠️';
        conflictIndicator.title = 'This event conflicts with another appointment';
        element.appendChild(conflictIndicator);
      }
    }
  }
}
