// C:\MY-APP\mr-legal-associates\functions\index.js

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
const { onDocumentCreated } = require("firebase-functions/v2/firestore"); // ✅ Import for v2 Firestore trigger
const admin = require("firebase-admin");

admin.initializeApp();

setGlobalOptions({ region: "asia-south1" });

const db = admin.firestore();

// === DAILY HEARING REMINDER ===

exports.dailyHearingReminder = onSchedule(
  {
    schedule: "0 3 * * *",
    timeZone: "Asia/Kolkata",
  },
  async (event) => {
    console.log("Running daily hearing reminder function...");

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const formatted = tomorrow.toISOString().split("T")[0]; // yyyy-mm-dd
    console.log(`Looking for hearings scheduled on: ${formatted}`);

    try {
      const snapshot = await db.collection("hearings").get();

      const hearingsForTomorrow = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.hearingDate === formatted) {
          console.log(`Hearing found for tomorrow: ${data.caseTitle}`);
          hearingsForTomorrow.push(data);
        }
      });

      if (hearingsForTomorrow.length === 0) {
        console.log("No hearings scheduled for tomorrow.");
        return null;
      }

      const adminEmail = "naveenraj9010@gmail.com"; // 🔥 your admin email
      const userTokenSnap = await db.collection("userTokens").doc(adminEmail).get();
      const lawyerFcmToken = userTokenSnap.exists ? userTokenSnap.data().fcmToken : null;

      if (!lawyerFcmToken) {
        console.error("No FCM token found for lawyer/admin!");
        return null;
      }

      console.log(`Sending notifications to FCM token: ${lawyerFcmToken}`);

      const sendPromises = hearingsForTomorrow.map(async (hearing) => {
        const message = {
          notification: {
            title: "📅 Hearing Reminder",
            body: `Reminder: Hearing for "${hearing.caseTitle}" is scheduled for tomorrow.`,
          },
          token: lawyerFcmToken,
        };

        try {
          const response = await admin.messaging().send(message);
          console.log(`Notification sent successfully for case "${hearing.caseTitle}":`, response);
        } catch (error) {
          console.error(`Error sending notification for case "${hearing.caseTitle}":`, error);
        }
      });

      await Promise.all(sendPromises); // ✅ Wait for all sends to complete
    } catch (error) {
      console.error("Error reading hearings or sending notifications:", error);
    }

    return null;
  }
);

// === SEND CONSULTATION NOTIFICATION ===

exports.sendConsultationNotification = onDocumentCreated({
  document: 'consultations/{consultationId}'
}, async (event) => {

  console.log('New consultation booked — sending notification...');

  const data = event.data?.data();
  if (!data) {
    console.error('No data found in new consultation document.');
    return null;
  }

  const adminEmail = "naveenraj9010@gmail.com"; // 🔥 your admin email
  const userTokenSnap = await db.collection("userTokens").doc(adminEmail).get();
  const lawyerFcmToken = userTokenSnap.exists ? userTokenSnap.data().fcmToken : null;

  if (!lawyerFcmToken) {
    console.error("No FCM token found for lawyer/admin!");
    return null;
  }

  console.log(`Sending consultation notification to FCM token: ${lawyerFcmToken}`);

  const message = {
    notification: {
      title: '📢 New Consultation Booked',
      body: `Client: ${data.clientName}, Message: ${data.message?.substring(0, 50) || 'Consultation'}`,
    },
    token: lawyerFcmToken,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Consultation notification sent successfully:', response);
  } catch (error) {
    console.error('Error sending consultation notification:', error);
  }

  return null;
});
