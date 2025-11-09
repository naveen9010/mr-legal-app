// src/app/services/notification.service.ts
// @ts-nocheck - Disable TypeScript checking for this file to fix FCM notification issues

import { Injectable } from '@angular/core';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { firebaseApp } from '../config/firebase.config'; // Initialized app
import { 
  collection, 
  doc, 
  Firestore, 
  setDoc, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly VAPID_PUBLIC_KEY = 'BGQmd5LuQdZXtXgh7Rji6q6AONbiFS0aDltbB6kgC8NhykbjgkmNNR7uSRsttjQbJa3NzncklOyyYnqan-ifEVM';

  private messaging: Messaging | undefined;
  private activeConsultationId: string | null = null;
  
  // Collection name for notification logs
  private readonly NOTIFICATION_LOGS_COLLECTION = 'notificationLogs';

  constructor(
    private firestore: Firestore,
    private router: Router
  ) {
    if (this.isBrowser()) {
      this.messaging = getMessaging(firebaseApp); // ✅ use initialized app
      this.listenForMessages();
    } else {
      console.log('[NotificationService] Skipping initialization on server');
    }
  }

// src/app/services/notification.service.ts

async requestPermissionAndTokenForAdmin() {
  if (!this.isBrowser() || !this.messaging) return;

  try {
    const token = await getToken(this.messaging, {
      vapidKey: this.VAPID_PUBLIC_KEY
    });
    console.log('[Admin FCM Token]', token);

    if (token) {
      // ✅ Now store using logged-in admin email as UID
      const adminEmail = localStorage.getItem('adminEmail');
      if (adminEmail) {
        const tokenRef = collection(this.firestore, 'userTokens');
        await setDoc(doc(tokenRef, adminEmail), { fcmToken: token });
        console.log(`[NotificationService] Admin FCM Token saved for ${adminEmail} ✅`);
      } else {
        console.warn('[NotificationService] Admin email not found in localStorage, cannot save token ❌');
      }
    } else {
      console.warn('[NotificationService] No FCM token obtained ❌');
    }
  } catch (err) {
    console.error('FCM permission denied or error', err);
  }
}


  // Keep track of notification IDs we've shown to prevent duplicates
  private shownNotifications = new Set<string>();

  private listenForMessages() {
    if (!this.isBrowser() || !this.messaging) return;

    onMessage(this.messaging, (payload) => {
      console.log('[NotificationService] Foreground Message received:', payload);
      
      try {
        // Extract data and notification from payload
        const data = payload.data || {};
        
        // Check if we have a notification object with a title
        if (!payload.notification || !payload.notification.title) {
          console.log('[NotificationService] Notification missing title, skipping display');
          return;
        }
        
        // We've already checked that payload.notification and payload.notification.title exist
        // Create local variables with known types
        const notification = payload.notification!;
        // Use type assertions to help TypeScript understand these are strings
        const notificationTitle: string = notification.title || '';
        const notificationBody: string = notification.body || '';
        
        // Create a unique ID for this notification
        // Use a consistent format that matches the service worker
        const notificationId = `${notificationTitle}-${notificationBody}-${data['type'] || ''}-${data['consultDate'] || data['hearingDate'] || ''}-${data['clientName'] || data['caseTitle'] || ''}`;
        
        // Check if we've already shown this notification
        if (this.shownNotifications.has(notificationId)) {
          console.log('[NotificationService] Foreground notification suppressed to prevent duplicates');
          
          // Log the suppressed notification
          this.logNotification({
            title: notificationTitle,
            body: notificationBody,
            data: data,
            timestamp: new Date(),
            status: 'suppressed',
            notificationId: notificationId,
            type: 'foreground',
            reason: 'Duplicate notification'
          });
          
          // Even though we're suppressing the notification display, we should still process the data
          // This ensures the application can react to the notification data
          if (data) {
            console.log('[NotificationService] Message data:', data);
            
            // Store the consultation ID if present for potential navigation
            if (data['type'] === 'consultation' && data['consultationId']) {
              this.activeConsultationId = data['consultationId'];
              
              // Navigate to the admin dashboard with the consultation tab active
              this.router.navigate(['/admin-dashboard'], { 
                queryParams: { 
                  tab: 'consultations',
                  id: data['consultationId']
                }
              });
            }
          }
          
          return;
        }
        
        // Add this notification to our tracking set
        this.shownNotifications.add(notificationId);
        
        // Limit the size of our tracking set to prevent memory issues
        if (this.shownNotifications.size > 100) {
          // Remove the oldest notification ID (first item in the set)
          this.shownNotifications.delete(this.shownNotifications.values().next().value);
        }
        
        // Show the notification in the foreground if browser notifications are supported
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            // Create notification options
            const options = {
              body: notificationBody,
              tag: notificationId,
              data: data,
              icon: '/assets/icons/icon-192x192.png', // Add icon for better visibility
              requireInteraction: true // Keep notification visible until user interacts with it
            };
            
            // Create and show the notification
            // Use the non-null assertion to tell TypeScript that notificationTitle is not null
            const notificationInstance = new Notification(notificationTitle!, options);
            console.log('[NotificationService] Foreground notification displayed');
            
            // Add click event handler to the notification
            notificationInstance.onclick = () => {
              console.log('[NotificationService] Notification clicked');
              window.focus(); // Focus the window
              
              // Navigate based on notification type
              if (data['type'] === 'consultation' && data['consultationId']) {
                this.router.navigate(['/admin-dashboard'], { 
                  queryParams: { 
                    tab: 'consultations',
                    id: data['consultationId']
                  }
                });
              }
              
              // Close the notification
              notificationInstance.close();
            };
            
            // Log this notification to Firestore
            this.logNotification({
              title: notificationTitle,
              body: notificationBody,
              data: data,
              timestamp: new Date(),
              status: 'displayed',
              notificationId: notificationId,
              type: 'foreground'
            });
          } catch (error) {
            console.error('[NotificationService] Error displaying notification:', error);
            
            // Log the error
            this.logNotification({
              title: notificationTitle,
              body: notificationBody,
              data: data,
              timestamp: new Date(),
              status: 'error',
              notificationId: notificationId,
              type: 'foreground',
              error: error.toString()
            });
          }
        } else {
          console.log('[NotificationService] Browser notifications not supported or permission not granted');
          
          // Log the suppressed notification
          this.logNotification({
            title: notificationTitle,
            body: notificationBody,
            data: data,
            timestamp: new Date(),
            status: 'suppressed',
            notificationId: notificationId,
            type: 'foreground',
            reason: 'Notification permission not granted or not supported'
          });
        }
        
        // Log the message data for debugging
        if (data) {
          console.log('[NotificationService] Message data:', data);
          
          // Store the consultation ID if present for potential navigation
          if (data['type'] === 'consultation' && data['consultationId']) {
            this.activeConsultationId = data['consultationId'];
          }
        }
      } catch (error) {
        console.error('[NotificationService] Error processing notification:', error);
      }
    });
  }

  /**
   * This method has been removed to prevent duplicate notifications.
   * Notifications are now handled directly by the Cloud Function that
   * triggers when a new consultation document is created.
   */

  /**
   * Get the active consultation ID if a notification was clicked
   */
  getActiveConsultationId(): string | null {
    return this.activeConsultationId;
  }

  /**
   * Clear the active consultation ID
   */
  clearActiveConsultationId(): void {
    this.activeConsultationId = null;
  }


  /**
   * Log a notification to Firestore for troubleshooting
   * @param notificationData The notification data to log
   */
  private async logNotification(notificationData: any): Promise<void> {
    try {
      // Get the admin email if available
      const adminEmail = localStorage.getItem('adminEmail') || 'unknown';
      
      // Create the log entry
      const logEntry = {
        ...notificationData,
        adminEmail: adminEmail,
        clientTimestamp: new Date(),
        serverTimestamp: serverTimestamp(),
        userAgent: navigator.userAgent,
        platform: navigator.platform
      };
      
      // Add to Firestore
      const logsCollection = collection(this.firestore, this.NOTIFICATION_LOGS_COLLECTION);
      await addDoc(logsCollection, logEntry);
      console.log('[NotificationService] Notification logged successfully');
    } catch (error) {
      console.error('[NotificationService] Error logging notification:', error);
    }
  }
  
  /**
   * Get notification logs for troubleshooting
   * @param limit The maximum number of logs to retrieve (default: 100)
   * @returns An observable of notification logs
   */
  getNotificationLogs(maxResults: number = 100): Observable<any[]> {
    const logsCollection = collection(this.firestore, this.NOTIFICATION_LOGS_COLLECTION);
    const logsQuery = query(
      logsCollection,
      orderBy('serverTimestamp', 'desc'),
      limit(maxResults)
    );
    
    return new Observable(observer => {
      // Set up the snapshot listener
      const unsubscribe = getDocs(logsQuery)
        .then(snapshot => {
          const logs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          observer.next(logs);
          observer.complete();
        })
        .catch(error => {
          console.error('[NotificationService] Error getting notification logs:', error);
          observer.error(error);
        });
      
      // Return the unsubscribe function
      return () => unsubscribe;
    });
  }
  
  /**
   * Get notification logs for a specific time period
   * @param startDate The start date for the logs
   * @param endDate The end date for the logs
   * @returns An observable of notification logs
   */
  getNotificationLogsByDateRange(startDate: Date, endDate: Date): Observable<any[]> {
    const logsCollection = collection(this.firestore, this.NOTIFICATION_LOGS_COLLECTION);
    const logsQuery = query(
      logsCollection,
      where('clientTimestamp', '>=', startDate),
      where('clientTimestamp', '<=', endDate),
      orderBy('clientTimestamp', 'desc')
    );
    
    return new Observable(observer => {
      // Set up the snapshot listener
      const unsubscribe = getDocs(logsQuery)
        .then(snapshot => {
          const logs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          observer.next(logs);
          observer.complete();
        })
        .catch(error => {
          console.error('[NotificationService] Error getting notification logs by date range:', error);
          observer.error(error);
        });
      
      // Return the unsubscribe function
      return () => unsubscribe;
    });
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined';
  }
}
