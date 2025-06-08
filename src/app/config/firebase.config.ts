// src/app/config/firebase.config.ts
import { initializeApp, FirebaseApp } from '@angular/fire/app';
import { provideFirebaseApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideMessaging, getMessaging } from '@angular/fire/messaging';

export const firebaseApp: FirebaseApp = initializeApp({
  apiKey: "AIzaSyBun9n9h3QDHudo11IE3lhcFkhSLn5XPD4",
  authDomain: "mr-legal-hearings.firebaseapp.com",
  projectId: "mr-legal-hearings",
  storageBucket: "mr-legal-hearings.firebasestorage.app",
  messagingSenderId: "611773104435",
  appId: "1:611773104435:web:6566bc3de1d53e377ffe46"
});

export const FIREBASE_PROVIDERS = [
  provideFirebaseApp(() => firebaseApp),
  provideFirestore(() => getFirestore(firebaseApp)),
  provideAuth(() => getAuth(firebaseApp)),
  provideMessaging(() => getMessaging(firebaseApp)) // ✅ pass the app explicitly
];
