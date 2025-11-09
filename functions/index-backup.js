// C:\MY-APP\mr-legal-associates\functions\index.js

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
const { onDocumentCreated } = require("firebase-functions/v2/firestore"); // ✅ Import for v2 Firestore trigger
const { onRequest } = require("firebase-functions/v2/https"); // ✅ Import for HTTP functions
const admin = require("firebase-admin");
const TelegramBot = require("node-telegram-bot-api");

admin.initializeApp();

setGlobalOptions({ region: "asia-south1" });

const db = admin.firestore();

// ============================================
// 🤖 TELEGRAM BOT CONFIGURATION
// ============================================
const TELEGRAM_BOT_TOKEN = "8418652037:AAEnpQsDeEQJhC5eDLFv8CrCGxdPHOBwWgo";
const TELEGRAM_ADMIN_CHAT_ID = "5231951393";

// Initialize Telegram Bot (no polling needed for Cloud Functions)
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);

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
          hearingsForTomorrow.push({ id: doc.id, ...data });
        }
      });

      if (hearingsForTomorrow.length === 0) {
        console.log("No hearings scheduled for tomorrow.");
        return null;
      }

      // Group hearings by case title to prevent duplicate notifications
      const hearingsByCase = {};
      hearingsForTomorrow.forEach(hearing => {
        const key = hearing.caseTitle;
        if (!hearingsByCase[key]) {
          hearingsByCase[key] = hearing;
        }
      });
      
      console.log(`Sending Telegram notifications for ${Object.keys(hearingsByCase).length} unique hearings`);
      
      // Build Telegram message
      let telegramMessage = "⚖️ *Hearing Reminder*\n\n";
      telegramMessage += `📅 *Tomorrow's Hearings (${formatted})*\n\n`;
      
      Object.values(hearingsByCase).forEach((hearing, index) => {
        telegramMessage += `${index + 1}. *${hearing.caseTitle}*\n`;
        if (hearing.courtName) telegramMessage += `   📍 ${hearing.courtName}\n`;
        if (hearing.hearingTime) telegramMessage += `   ⏰ ${hearing.hearingTime}\n`;
        if (hearing.clientName) telegramMessage += `   👤 Client: ${hearing.clientName}\n`;
        telegramMessage += `\n`;
      });

      // Send single consolidated message via Telegram
      try {
        await bot.sendMessage(TELEGRAM_ADMIN_CHAT_ID, telegramMessage, { 
          parse_mode: "Markdown" 
        });
        console.log("✅ Telegram hearing reminder sent successfully");
        
        // Log to Firestore
        await db.collection("notificationLogs").add({
          type: "hearing_reminder",
          date: formatted,
          hearingsCount: Object.keys(hearingsByCase).length,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          platform: "telegram",
          status: "success"
        });
      } catch (error) {
        console.error("❌ Error sending Telegram hearing reminder:", error);
        
        // Log error to Firestore
        await db.collection("notificationLogs").add({
          type: "hearing_reminder",
          date: formatted,
          error: error.message,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          platform: "telegram",
          status: "failed"
        });
      }
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

  console.log('New consultation booked — sending Telegram notification...');

  const data = event.data?.data();
  if (!data) {
    console.error('No data found in new consultation document.');
    return null;
  }

  const consultationId = event.params.consultationId;

  // Build formatted Telegram message
  let telegramMessage = "🔔 *New Consultation Request*\n\n";
  telegramMessage += `👤 *Client:* ${data.clientName || 'N/A'}\n`;
  telegramMessage += `📅 *Date:* ${data.consultDate || 'N/A'}\n`;
  telegramMessage += `⏰ *Time:* ${data.consultTime || 'N/A'}\n`;
  
  if (data.email) telegramMessage += `📧 *Email:* ${data.email}\n`;
  if (data.phone) telegramMessage += `📱 *Phone:* ${data.phone}\n`;
  if (data.caseType) telegramMessage += `⚖️ *Case Type:* ${data.caseType}\n`;
  if (data.message) telegramMessage += `\n💬 *Message:*\n${data.message}\n`;
  
  telegramMessage += `\n🆔 *ID:* \`${consultationId}\``;

  // Add inline keyboard with Accept/Decline buttons
  const keyboard = {
    inline_keyboard: [
      [
        { text: "✅ Accept", callback_data: `accept_${consultationId}` },
        { text: "❌ Decline", callback_data: `decline_${consultationId}` }
      ],
      [
        { text: "📅 View Dashboard", url: "https://your-app-url.com/admin-dashboard?tab=consultations" }
      ]
    ]
  };

  try {
    await bot.sendMessage(TELEGRAM_ADMIN_CHAT_ID, telegramMessage, { 
      parse_mode: "Markdown",
      reply_markup: keyboard
    });
    console.log('✅ Telegram consultation notification sent successfully');
    
    // Log to Firestore
    await db.collection("notificationLogs").add({
      type: "consultation_request",
      consultationId: consultationId,
      clientName: data.clientName,
      consultDate: data.consultDate,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      platform: "telegram",
      status: "success"
    });
  } catch (error) {
    console.error('❌ Error sending Telegram consultation notification:', error);
    
    // Log error to Firestore
    await db.collection("notificationLogs").add({
      type: "consultation_request",
      consultationId: consultationId,
      error: error.message,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      platform: "telegram",
      status: "failed"
    });
  }

  return null;
});

// === TELEGRAM WEBHOOK FOR BUTTON ACTIONS ===

exports.telegramWebhook = onRequest({
  cors: true
}, async (req, res) => {
  try {
    // Telegram sends POST requests with updates
    if (req.method !== 'POST') {
      res.status(200).send('Telegram Webhook Active');
      return;
    }

    const update = req.body;
    console.log('Telegram webhook update:', JSON.stringify(update));

    // Handle callback queries (button clicks)
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const data = callbackQuery.data;
      const chatId = callbackQuery.message.chat.id;
      const messageId = callbackQuery.message.message_id;

      // Parse callback data (format: action_consultationId)
      const [action, consultationId] = data.split('_');

      if (action === 'accept' || action === 'decline') {
        try {
          // Update consultation status in Firestore
          const consultationRef = db.collection('consultations').doc(consultationId);
          const consultationSnap = await consultationRef.get();

          if (!consultationSnap.exists) {
            await bot.answerCallbackQuery(callbackQuery.id, {
              text: '❌ Consultation not found',
              show_alert: true
            });
            res.status(200).send('OK');
            return;
          }

          const status = action === 'accept' ? 'accepted' : 'declined';
          await consultationRef.update({ 
            status: status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          // Update the message to show action taken
          const consultation = consultationSnap.data();
          const emoji = action === 'accept' ? '✅' : '❌';
          const statusText = action === 'accept' ? 'ACCEPTED' : 'DECLINED';
          
          let updatedMessage = `${emoji} *Consultation ${statusText}*\n\n`;
          updatedMessage += `👤 *Client:* ${consultation.clientName || 'N/A'}\n`;
          updatedMessage += `📅 *Date:* ${consultation.consultDate || 'N/A'}\n`;
          updatedMessage += `⏰ *Time:* ${consultation.consultTime || 'N/A'}\n`;
          if (consultation.email) updatedMessage += `📧 *Email:* ${consultation.email}\n`;
          if (consultation.phone) updatedMessage += `📱 *Phone:* ${consultation.phone}\n`;
          updatedMessage += `\n🆔 *ID:* \`${consultationId}\``;
          updatedMessage += `\n\n*Status:* ${statusText} ✓`;

          await bot.editMessageText(updatedMessage, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "Markdown"
          });

          await bot.answerCallbackQuery(callbackQuery.id, {
            text: `✓ Consultation ${statusText.toLowerCase()}`,
            show_alert: false
          });

          console.log(`✅ Consultation ${consultationId} ${statusText.toLowerCase()}`);
        } catch (error) {
          console.error('Error processing consultation action:', error);
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: '❌ Error processing action',
            show_alert: true
          });
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error in Telegram webhook:', error);
    res.status(200).send('OK'); // Always return 200 to Telegram
  }
});

// === HANDLE CONSULTATION ACTIONS (For web dashboard) ===

exports.consultationAction = onRequest({
  cors: true
}, async (req, res) => {
  try {
    // Check if this is a POST request
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    // Get the action and consultation ID from the request
    const { action, consultationId } = req.body;
    
    if (!action || !consultationId) {
      res.status(400).send('Missing required parameters');
      return;
    }

    // Get the consultation document
    const consultationRef = db.collection('consultations').doc(consultationId);
    const consultationSnap = await consultationRef.get();
    
    if (!consultationSnap.exists) {
      res.status(404).send('Consultation not found');
      return;
    }
    
    const consultation = consultationSnap.data();
    
    // Process the action
    if (action === 'accept') {
      // Update the consultation status
      await consultationRef.update({ 
        status: 'accepted',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Send Telegram notification about the action
      try {
        const message = `✅ *Consultation Accepted via Dashboard*\n\n` +
                       `👤 Client: ${consultation.clientName}\n` +
                       `📅 Date: ${consultation.consultDate}\n` +
                       `⏰ Time: ${consultation.consultTime}`;
        await bot.sendMessage(TELEGRAM_ADMIN_CHAT_ID, message, { parse_mode: "Markdown" });
      } catch (telegramError) {
        console.error('Error sending Telegram confirmation:', telegramError);
      }
      
      res.status(200).json({ 
        success: true, 
        message: 'Consultation accepted',
        consultation: {
          id: consultationId,
          ...consultation
        }
      });
    } 
    else if (action === 'decline') {
      // Update the consultation status
      await consultationRef.update({ 
        status: 'declined',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Send Telegram notification about the action
      try {
        const message = `❌ *Consultation Declined via Dashboard*\n\n` +
                       `👤 Client: ${consultation.clientName}\n` +
                       `📅 Date: ${consultation.consultDate}\n` +
                       `⏰ Time: ${consultation.consultTime}`;
        await bot.sendMessage(TELEGRAM_ADMIN_CHAT_ID, message, { parse_mode: "Markdown" });
      } catch (telegramError) {
        console.error('Error sending Telegram confirmation:', telegramError);
      }
      
      res.status(200).json({ 
        success: true, 
        message: 'Consultation declined',
        consultation: {
          id: consultationId,
          ...consultation
        }
      });
    } 
    else {
      res.status(400).send('Invalid action');
    }
  } catch (error) {
    console.error('Error processing consultation action:', error);
    res.status(500).send('Internal Server Error');
  }
});
