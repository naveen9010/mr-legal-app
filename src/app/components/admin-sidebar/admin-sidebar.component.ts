import { Component, EventEmitter, Input, Output, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss'
})
export class AdminSidebarComponent {
  @Input() activeMenuItem: string = '';
  @Input() collapsed: boolean = false;
  @Output() menuItemSelected = new EventEmitter<string>();
  @Output() logoutClicked = new EventEmitter<void>();
  @Output() toggleSidebar = new EventEmitter<void>();
  
  @HostBinding('class.collapsed') get isCollapsed() {
    return this.collapsed;
  }

  menuItems: MenuItem[] = [
    { id: 'hearings', label: 'Hearing Schedules', icon: 'gavel' },
    { id: 'calendar', label: 'Calendar View', icon: 'calendar_today' },
    { id: 'forward-judgement', label: 'Forward Judgement', icon: 'forward_to_inbox' },
    { id: 'consultations', label: 'Consultation Requests', icon: 'people' },
    { id: 'payments', label: 'Client Payment Details', icon: 'payment' },
    { id: 'notifications', label: 'Notification Logs', icon: 'notifications' }
  ];

  constructor(private router: Router) {}

  selectMenuItem(menuItemId: string): void {
    this.activeMenuItem = menuItemId;
    this.menuItemSelected.emit(menuItemId);
  }

  logout(): void {
    this.logoutClicked.emit();
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }
  
  toggleSidebarCollapse(): void {
    this.toggleSidebar.emit();
  }
}
