import { Injectable } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { SwPush } from '@angular/service-worker';

@Injectable({ providedIn: 'root' })
export class ReminderService {
  constructor(private firestore: Firestore, private swPush: SwPush) {}

  async checkHearingsAndNotify() {
    // This method is disabled - notifications are now handled exclusively by the Cloud Function
    console.log('[ReminderService] Client-side hearing notifications are disabled');
    console.log('[ReminderService] Hearing notifications are now handled by the dailyHearingReminder Cloud Function');
    
    // We'll still check for hearings for logging purposes, but won't show notifications
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const formatted = tomorrow.toISOString().split('T')[0]; // yyyy-mm-dd
    const snapshot = await getDocs(collection(this.firestore, 'hearings'));

    let hearingsFound = 0;
    snapshot.forEach(doc => {
      const data: any = doc.data();
      if (data.hearingDate === formatted) {
        hearingsFound++;
        // No longer showing notifications from client side
      }
    });
    
    console.log(`[ReminderService] Found ${hearingsFound} hearings for tomorrow (${formatted})`);
    console.log('[ReminderService] Notifications will be sent by the Cloud Function at 3:00 AM IST');
  }

  private showNotification(message: string) {
    // This method is disabled - notifications are now handled exclusively by the Cloud Function
    console.log('[ReminderService] Suppressing client-side notification:', message);
    console.log('[ReminderService] Notifications are now handled by the Cloud Function');
    
    // No longer creating notifications from client side
    // if ('Notification' in window && Notification.permission === 'granted') {
    //   new Notification('MR Legal Associates', {
    //     body: message,
    //     icon: 'assets/logo-mr-legal.png'
    //   });
    // }
  }
}
