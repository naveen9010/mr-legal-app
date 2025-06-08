import { Injectable } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { SwPush } from '@angular/service-worker';

@Injectable({ providedIn: 'root' })
export class ReminderService {
  constructor(private firestore: Firestore, private swPush: SwPush) {}

  async checkHearingsAndNotify() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const formatted = tomorrow.toISOString().split('T')[0]; // yyyy-mm-dd
    const snapshot = await getDocs(collection(this.firestore, 'hearings'));

    snapshot.forEach(doc => {
      const data: any = doc.data();
      if (data.hearingDate === formatted) {
        this.showNotification(`📅 Reminder: Hearing for "${data.caseTitle}" is tomorrow.`);
      }
    });
  }

  private showNotification(message: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('MR Legal Associates', {
        body: message,
        icon: 'assets/logo-mr-legal.png'
      });
    }
  }
}
