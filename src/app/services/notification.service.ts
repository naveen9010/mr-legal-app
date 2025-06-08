import { Injectable } from '@angular/core';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { firebaseApp } from '../config/firebase.config';
import { Firestore, doc, setDoc } from '@angular/fire/firestore'; // ✅ ADD THIS

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly VAPID_PUBLIC_KEY = 'BGQmd5LuQdZXtXgh7Rji6q6AONbiFS0aDltbB6kgC8NhykbjgkmNNR7uSRsttjQbJa3NzncklOyyYnqan-ifEVM';

  private messaging: Messaging;

  constructor(private firestore: Firestore) { // ✅ Add Firestore injection
    this.messaging = getMessaging(firebaseApp);
    this.listenForMessages();
  }

  async requestPermissionAndToken() {
    try {
      const token = await getToken(this.messaging, {
        vapidKey: this.VAPID_PUBLIC_KEY
      });

      console.log('[FCM Token]', token);

      // ✅ Save token to Firestore:
      const adminEmail = localStorage.getItem('adminEmail'); // Must be set on admin login
      if (adminEmail) {
        const tokenRef = doc(this.firestore, `adminFCMTokens/${adminEmail}`);
        await setDoc(tokenRef, { token, updatedAt: new Date().toISOString() });
        console.log('✅ FCM Token saved to Firestore!');
      } else {
        console.warn('⚠️ Admin email not found in localStorage, cannot save FCM token.');
      }

    } catch (err) {
      console.error('FCM permission denied or error', err);
    }
  }

  private listenForMessages() {
    onMessage(this.messaging, (payload) => {
      console.log('Foreground Message:', payload);
      const { title, body } = payload.notification ?? {};
      if (Notification.permission === 'granted' && title) {
        new Notification(title, { body });
      }
    });
  }
}