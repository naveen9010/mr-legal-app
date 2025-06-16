// src/app/services/notification.service.ts

import { Injectable } from '@angular/core';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { firebaseApp } from '../config/firebase.config'; // Initialized app
import { collection, doc, Firestore, setDoc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly VAPID_PUBLIC_KEY = 'BGQmd5LuQdZXtXgh7Rji6q6AONbiFS0aDltbB6kgC8NhykbjgkmNNR7uSRsttjQbJa3NzncklOyyYnqan-ifEVM';

  private messaging: Messaging | undefined;

  constructor(private firestore: Firestore) {
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


  private listenForMessages() {
    if (!this.isBrowser() || !this.messaging) return;

    onMessage(this.messaging, (payload) => {
      console.log('Foreground Message:', payload);
      const { title, body } = payload.notification ?? {};
      if (Notification.permission === 'granted' && title) {
        new Notification(title, { body });
      }
    });
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined';
  }
}