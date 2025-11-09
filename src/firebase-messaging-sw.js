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

// Keep track of notification IDs we've shown to prevent duplicates
const shownNotifications = new Set();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const { title, body } = payload.notification || {};
  const data = payload.data || {};
  
  // Create a unique ID for this notification based on its content
  // Match the format used in notification.service.ts to ensure consistency
  const notificationId = `${title}-${body}-${data.type || ''}-${data.consultDate || data.hearingDate || ''}-${data.clientName || data.caseTitle || ''}`;
  
  // Check if we've already shown this notification
  if (shownNotifications.has(notificationId)) {
    console.log('[firebase-messaging-sw.js] Suppressing duplicate notification:', notificationId);
    return;
  }
  
  // Add this notification to our tracking set
  shownNotifications.add(notificationId);
  
  // Limit the size of our tracking set to prevent memory issues
  if (shownNotifications.size > 100) {
    // Remove the oldest notification ID (first item in the set)
    shownNotifications.delete(shownNotifications.values().next().value);
  }
  
  if (title) {
    // Simple notification without problematic fields
    // Avoid using icon and clickAction fields that cause errors
    const notificationOptions = {
      body: body,
      tag: notificationId, // Using tag ensures only one notification with this ID is shown
    };
    
    // Only add data if it exists and doesn't contain problematic fields
    if (payload.data) {
      // Create a clean copy of the data without problematic fields
      const cleanData = {};
      Object.keys(payload.data).forEach(key => {
        if (key !== 'icon' && key !== 'clickAction') {
          cleanData[key] = payload.data[key];
        }
      });
      
      notificationOptions.data = cleanData;
    }
    
    return self.registration.showNotification(title, notificationOptions);
  }
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click Received.');

  const notification = event.notification;
  const data = notification.data;
  notification.close();

  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(
    clients.matchAll({
      type: "window"
    })
    .then(function(clientList) {
      if (clients.openWindow) {
        // Determine URL to navigate to based on notification type
        let url = '/admin-dashboard';
        
        if (data && data.type === 'consultation') {
          url = '/admin-dashboard?tab=consultations';
          if (data.consultationId) {
            url += '&id=' + data.consultationId;
          }
        } else if (data && data.type === 'hearing') {
          url = '/admin-dashboard?tab=hearings';
          if (data.hearingId) {
            url += '&id=' + data.hearingId;
          }
        }
        
        return clients.openWindow(url);
      }
    })
  );
});
