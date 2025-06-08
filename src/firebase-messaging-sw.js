importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBun9n9h3QDHudo11IE3lhcFkhSLn5XPD4",
  authDomain: "mr-legal-hearings.firebaseapp.com",
  projectId: "mr-legal-hearings",
  storageBucket: "mr-legal-hearings.firebasestorage.app",
  messagingSenderId: "611773104435",
  appId: "1:611773104435:web:6566bc3de1d53e377ffe46"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/assets/logo-mr-legal.png'
  });
});
