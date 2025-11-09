import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../../services/notification.service';
import { PremiumLoaderComponent } from '../premium-loader/premium-loader.component';

@Component({
  selector: 'app-notification-logs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    PremiumLoaderComponent
  ],
  templateUrl: './notification-logs.component.html',
  styleUrl: './notification-logs.component.scss'
})
export class NotificationLogsComponent implements OnInit {
  notificationLogs: any[] = [];
  filteredLogs: any[] = [];
  displayedColumns: string[] = ['timestamp', 'title', 'status', 'type', 'details'];
  
  // Filtering
  startDate: Date | null = null;
  endDate: Date | null = null;
  searchTerm: string = '';
  
  // Pagination
  pageSize = 10;
  pageIndex = 0;
  totalLogs = 0;
  
  // Loading state
  isLoading = false;

  constructor(
    private notificationService: NotificationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadNotificationLogs();
  }

  loadNotificationLogs(): void {
    this.isLoading = true;
    
    // If date range is specified, use date range query
    if (this.startDate && this.endDate) {
      this.notificationService.getNotificationLogsByDateRange(this.startDate, this.endDate)
        .subscribe({
          next: (logs) => {
            this.notificationLogs = logs;
            this.applyFilters();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading notification logs:', error);
            this.snackBar.open('Error loading notification logs', 'Close', { duration: 3000 });
            this.isLoading = false;
          }
        });
    } else {
      // Otherwise, get the most recent logs
      this.notificationService.getNotificationLogs(100)
        .subscribe({
          next: (logs) => {
            this.notificationLogs = logs;
            this.applyFilters();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading notification logs:', error);
            this.snackBar.open('Error loading notification logs', 'Close', { duration: 3000 });
            this.isLoading = false;
          }
        });
    }
  }

  applyFilters(): void {
    let filtered = [...this.notificationLogs];
    
    // Apply search term filter if provided
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        (log.title && log.title.toLowerCase().includes(term)) ||
        (log.body && log.body.toLowerCase().includes(term)) ||
        (log.status && log.status.toLowerCase().includes(term)) ||
        (log.type && log.type.toLowerCase().includes(term)) ||
        (log.notificationId && log.notificationId.toLowerCase().includes(term))
      );
    }
    
    // Update filtered logs and total count
    this.filteredLogs = filtered;
    this.totalLogs = this.filteredLogs.length;
    
    // Reset to first page when filters change
    this.pageIndex = 0;
  }

  resetFilters(): void {
    this.startDate = null;
    this.endDate = null;
    this.searchTerm = '';
    this.loadNotificationLogs();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
  }

  onSortChange(sort: Sort): void {
    const data = [...this.filteredLogs];
    
    if (!sort.active || sort.direction === '') {
      this.filteredLogs = data;
      return;
    }

    this.filteredLogs = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'timestamp':
          return this.compare(new Date(a.timestamp).getTime(), new Date(b.timestamp).getTime(), isAsc);
        case 'title':
          return this.compare(a.title, b.title, isAsc);
        case 'status':
          return this.compare(a.status, b.status, isAsc);
        case 'type':
          return this.compare(a.type, b.type, isAsc);
        default:
          return 0;
      }
    });
  }

  private compare(a: number | string, b: number | string, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  // Format the timestamp for display
  formatTimestamp(timestamp: any): string {
    if (!timestamp) return 'N/A';
    
    // Handle Firestore Timestamp or Date object
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return date.toLocaleString();
  }

  // Get the details for a notification log
  getLogDetails(log: any): string {
    let details = '';
    
    if (log.data) {
      details += 'Data: ' + JSON.stringify(log.data) + '\n';
    }
    
    if (log.reason) {
      details += 'Reason: ' + log.reason + '\n';
    }
    
    if (log.adminEmail) {
      details += 'Admin: ' + log.adminEmail + '\n';
    }
    
    if (log.userAgent) {
      details += 'User Agent: ' + log.userAgent + '\n';
    }
    
    return details || 'No additional details';
  }
}
