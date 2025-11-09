import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationService } from './services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'mr-legal-associates';
  
  constructor(private notificationService: NotificationService) {}
  
  ngOnInit() {
    // Initialize notification service for admin users
    const isAdmin = localStorage.getItem('adminEmail') !== null;
    if (isAdmin) {
      setTimeout(() => {
        this.notificationService.requestPermissionAndTokenForAdmin()
          .catch(error => console.error('Error initializing notifications:', error));
      }, 2000); // Delay to ensure app is fully loaded
    }
  }
}
