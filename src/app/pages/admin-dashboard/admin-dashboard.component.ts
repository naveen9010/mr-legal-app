// src/app/components/admin-dashboard/admin-dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { HearingScheduleComponent } from '../hearing-schedule/hearing-schedule.component';
import { EnhancedCalendarComponent } from '../../calendar/enhanced-calendar/enhanced-calendar.component';
import { NotificationLogsComponent } from '../../components/notification-logs/notification-logs.component';
import { ClientPaymentDetailsComponent } from '../client-payment-details/client-payment-details.component';
import { ForwardJudgementComponent } from '../forward-judgement/forward-judgement.component';
import { AdminSidebarComponent } from '../../components/admin-sidebar/admin-sidebar.component';
import { PremiumLoaderComponent } from '../../components/premium-loader/premium-loader.component';
import { CommonModule } from '@angular/common';
import { ReminderService } from '../../services/reminder.service';
import { NotificationService } from '../../services/notification.service';
import { ConsultationService, Consultation } from '../../services/consultation.service';
import { environment } from '../../../environments/environment';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    HearingScheduleComponent,
    EnhancedCalendarComponent,
    NotificationLogsComponent,
    ClientPaymentDetailsComponent,
    ForwardJudgementComponent,
    AdminSidebarComponent,
    PremiumLoaderComponent,
    CommonModule, 
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  pendingConsultations: Consultation[] = [];
  activeMenuItem = 'hearings';
  isLoading = false;
  sidebarCollapsed = false;

  constructor(
    private reminderService: ReminderService,
    private notificationService: NotificationService,
    private consultationService: ConsultationService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Request permission & store FCM token for Admin
    if (this.isBrowser()) {
      this.notificationService.requestPermissionAndTokenForAdmin();
    }

    // Load pending consultations
    this.loadPendingConsultations();

    // Subscribe to real-time updates for pending consultations
    this.consultationService.pendingConsultations$.subscribe(consultations => {
      this.pendingConsultations = consultations;
    });
    
    // Check if we were navigated here from a notification
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'consultations') {
        this.activeMenuItem = 'consultations';
        
        // If there's a specific consultation ID, highlight it
        if (params['id']) {
          const consultationId = params['id'];
          // You could add highlighting logic here if needed
          console.log('Showing consultation:', consultationId);
        }
      } else if (params['tab'] === 'hearings') {
        this.activeMenuItem = 'hearings';
        
        // If there's a specific hearing ID, highlight it
        if (params['id']) {
          const hearingId = params['id'];
          console.log('Showing hearing:', hearingId);
        }
      } else if (params['tab'] === 'calendar') {
        this.activeMenuItem = 'calendar';
      } else if (params['tab'] === 'forward-judgement') {
        this.activeMenuItem = 'forward-judgement';
      } else if (params['tab'] === 'payments') {
        this.activeMenuItem = 'payments';
      } else if (params['tab'] === 'notifications') {
        this.activeMenuItem = 'notifications';
      }
    });

    // Client-side notifications are now completely disabled
    // Notifications are handled exclusively by the Cloud Function
    console.log('[AdminDashboardComponent] Client-side notifications are disabled');
    console.log('[AdminDashboardComponent] Notifications are now handled by the Cloud Function');
  }

  async loadPendingConsultations() {
    this.isLoading = true;
    try {
      this.pendingConsultations = await this.consultationService.getPendingConsultations();
    } finally {
      this.isLoading = false;
    }
  }

  async acceptConsultation(consultationId: string) {
    this.isLoading = true;
    try {
      const success = await this.consultationService.acceptConsultation(consultationId);
      if (success) {
        this.snackBar.open('Consultation accepted and added to calendar', 'Close', { duration: 3000 });
      } else {
        this.snackBar.open('Failed to accept consultation', 'Close', { duration: 3000 });
      }
    } finally {
      this.isLoading = false;
    }
  }

  async declineConsultation(consultationId: string) {
    this.isLoading = true;
    try {
      const success = await this.consultationService.declineConsultation(consultationId);
      if (success) {
        this.snackBar.open('Consultation declined', 'Close', { duration: 3000 });
      } else {
        this.snackBar.open('Failed to decline consultation', 'Close', { duration: 3000 });
      }
    } finally {
      this.isLoading = false;
    }
  }

  onMenuItemSelected(menuItemId: string) {
    this.activeMenuItem = menuItemId;
    
    // Update URL to reflect the current view
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: menuItemId },
      queryParamsHandling: 'merge'
    });
    
    // On mobile, collapse the sidebar after selection
    if (window.innerWidth <= 768) {
      this.sidebarCollapsed = true;
    }
  }
  
  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined';
  }

  logout(): void {
    localStorage.removeItem('adminEmail');
    this.router.navigate(['/']);
  }

}
