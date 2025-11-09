// ========================================
// MR LEGAL ASSOCIATES - ENHANCED CLOUD FUNCTIONS
// Telegram Bot Integration with Advanced Features
// ========================================

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
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

// Initialize Telegram Bot
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);

// ============================================
// 🔍 HELPER FUNCTION: Check if user has Telegram
// ============================================
async function checkTelegramUser(phoneNumber) {
  try {
    // Remove + and spaces from phone number
    const cleanPhone = phoneNumber.replace(/[+\s-]/g, '');
    
    // Try to get user info (this requires phone number to be registered)
    // Note: This is a simplified version. In production, you'd need user consent
    // and proper phone number verification
    
    console.log(`Checking Telegram for phone: ${cleanPhone}`);
    
    // For now, we'll store this in Firestore and check if user has contacted bot
    const userRef = await db.collection('telegramUsers').doc(cleanPhone).get();
    
    if (userRef.exists) {
      return userRef.data().chatId;
    }
    
    return null;
  } catch (error) {
    console.error('Error checking Telegram user:', error);
    return null;
  }
}

// ============================================
// 📱 SEND MESSAGE TO CLIENT
// ============================================
async function sendClientNotification(clientChatId, consultation, status) {
  try {
    const emoji = status === 'accepted' ? '✅' : '❌';
    const statusText = status === 'accepted' ? 'ACCEPTED' : 'DECLINED';
    const greeting = status === 'accepted' ? 
      'Good news! Your consultation has been confirmed.' : 
      'We regret to inform you that your consultation could not be scheduled at this time.';
    
    let message = `${emoji} *Consultation ${statusText}*\n\n`;
    message += `Dear ${consultation.clientName},\n\n`;
    message += `${greeting}\n\n`;
    message += `📅 *Date:* ${consultation.consultDate}\n`;
    message += `⏰ *Time:* ${consultation.consultTime}\n`;
    
    if (status === 'accepted') {
      message += `\n📍 Please arrive 10 minutes early.\n`;
      message += `📞 Contact: +91 99662 49729\n`;
      message += `\nWe look forward to meeting you!`;
    } else {
      message += `\nPlease contact us to reschedule: +91 99662 49729`;
    }
    
    await bot.sendMessage(clientChatId, message, { parse_mode: "Markdown" });
    console.log(`✅ Client notification sent to ${clientChatId}`);
    return true;
  } catch (error) {
    console.error('Error sending client notification:', error);
    return false;
  }
}

// ============================================
// 📊 DAILY SUMMARY REPORT (9 PM IST)
// ============================================
exports.dailySummaryReport = onSchedule(
  {
    schedule: "0 21 * * *", // 9:00 PM IST
    timeZone: "Asia/Kolkata",
  },
  async (event) => {
    console.log("Generating daily summary report...");

    try {
      const today = new Date();
      const todayStart = new Date(today.setHours(0, 0, 0, 0));
      const todayEnd = new Date(today.setHours(23, 59, 59, 999));

      // Get today's consultations
      const consultationsSnap = await db.collection("consultations")
        .where("createdAt", ">=", todayStart)
        .where("createdAt", "<=", todayEnd)
        .get();

      const consultations = {
        total: 0,
        pending: 0,
        accepted: 0,
        declined: 0,
        list: []
      };

      consultationsSnap.forEach(doc => {
        const data = doc.data();
        consultations.total++;
        consultations[data.status || 'pending']++;
        consultations.list.push({
          name: data.clientName,
          status: data.status || 'pending',
          date: data.consultDate,
          time: data.consultTime
        });
      });

      // Get tomorrow's hearings
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const tomorrowFormatted = tomorrow.toISOString().split("T")[0];

      const hearingsSnap = await db.collection("hearings")
        .where("hearingDate", "==", tomorrowFormatted)
        .get();

      const hearings = [];
      hearingsSnap.forEach(doc => {
        const data = doc.data();
        hearings.push({
          case: data.caseTitle,
          time: data.hearingTime,
          court: data.courtName
        });
      });

      // Build summary message
      let summary = "📊 *Daily Summary Report*\n";
      summary += `📅 ${today.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;
      
      summary += "🔔 *Today's Consultations*\n";
      summary += `Total: ${consultations.total}\n`;
      summary += `✅ Accepted: ${consultations.accepted}\n`;
      summary += `⏳ Pending: ${consultations.pending}\n`;
      summary += `❌ Declined: ${consultations.declined}\n\n`;

      if (consultations.list.length > 0) {
        summary += "*Consultation Details:*\n";
        consultations.list.forEach((c, i) => {
          summary += `${i + 1}. ${c.name} - ${c.status} (${c.date} ${c.time})\n`;
        });
        summary += "\n";
      }

      summary += "⚖️ *Tomorrow's Hearings*\n";
      if (hearings.length > 0) {
        hearings.forEach((h, i) => {
          summary += `${i + 1}. ${h.case}\n`;
          summary += `   ⏰ ${h.time} | 📍 ${h.court}\n`;
        });
      } else {
        summary += "No hearings scheduled for tomorrow.\n";
      }

      summary += "\n✨ *Have a great evening!*";

      // Send summary
      await bot.sendMessage(TELEGRAM_ADMIN_CHAT_ID, summary, { parse_mode: "Markdown" });
      console.log("✅ Daily summary report sent");

      // Log to Firestore
      await db.collection("notificationLogs").add({
        type: "daily_summary",
        date: today.toISOString().split("T")[0],
        consultations: consultations.total,
        hearings: hearings.length,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        platform: "telegram",
        status: "success"
      });

    } catch (error) {
      console.error("Error generating daily summary:", error);
    }

    return null;
  }
);

// ============================================
// 📅 HEARING REMINDER - 1 WEEK BEFORE (3 AM)
// ============================================
exports.weeklyHearingReminder = onSchedule(
  {
    schedule: "0 3 * * *", // 3:00 AM IST daily
    timeZone: "Asia/Kolkata",
  },
  async (event) => {
    console.log("Running weekly hearing reminder...");

    const today = new Date();
    const weekFromNow = new Date(today);
    weekFromNow.setDate(today.getDate() + 7);
    const formatted = weekFromNow.toISOString().split("T")[0];

    try {
      const snapshot = await db.collection("hearings")
        .where("hearingDate", "==", formatted)
        .get();

      if (snapshot.empty) {
        console.log("No hearings 1 week from now");
        return null;
      }

      const hearings = [];
      snapshot.forEach(doc => {
        hearings.push({ id: doc.id, ...doc.data() });
      });

      let message = "📆 *1 Week Reminder*\n\n";
      message += `Hearings scheduled for *${formatted}* (next week):\n\n`;

      hearings.forEach((h, i) => {
        message += `${i + 1}. *${h.caseTitle}*\n`;
        message += `   📍 ${h.courtName}\n`;
        message += `   ⏰ ${h.hearingTime}\n`;
        message += `   👤 ${h.clientName}\n\n`;
      });

      message += "⚠️ *Please prepare documents and case files*";

      await bot.sendMessage(TELEGRAM_ADMIN_CHAT_ID, message, { parse_mode: "Markdown" });
      console.log("✅ Weekly hearing reminder sent");

    } catch (error) {
      console.error("Error in weekly hearing reminder:", error);
    }

    return null;
  }
);

// ============================================
// 📅 HEARING REMINDER - 1 DAY BEFORE (3 AM)
// ============================================
exports.dailyHearingReminder = onSchedule(
  {
    schedule: "0 3 * * *", // 3:00 AM IST
    timeZone: "Asia/Kolkata",
  },
  async (event) => {
    console.log("Running daily hearing reminder...");

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const formatted = tomorrow.toISOString().split("T")[0];

    try {
      const snapshot = await db.collection("hearings")
        .where("hearingDate", "==", formatted)
        .get();

      if (snapshot.empty) {
        console.log("No hearings tomorrow");
        return null;
      }

      const hearings = [];
      snapshot.forEach(doc => {
        hearings.push({ id: doc.id, ...doc.data() });
      });

      let message = "⚖️ *Tomorrow's Hearing Reminder*\n\n";
      message += `📅 *${formatted}*\n\n`;

      hearings.forEach((h, i) => {
        message += `${i + 1}. *${h.caseTitle}*\n`;
        message += `   📍 ${h.courtName}\n`;
        message += `   ⏰ ${h.hearingTime}\n`;
        message += `   👤 Client: ${h.clientName}\n`;
        if (h.judgeName) message += `   ⚖️ Judge: ${h.judgeName}\n`;
        message += `\n`;
      });

      message += "🔔 *Final preparations reminder!*";

      await bot.sendMessage(TELEGRAM_ADMIN_CHAT_ID, message, { parse_mode: "Markdown" });
      console.log("✅ Daily hearing reminder sent");

    } catch (error) {
      console.error("Error in daily hearing reminder:", error);
    }

    return null;
  }
);

// ============================================
// 📅 HEARING REMINDER - 2 HOURS BEFORE
// ============================================
exports.hearingImminentReminder = onSchedule(
  {
    schedule: "*/30 * * * *", // Every 30 minutes
    timeZone: "Asia/Kolkata",
  },
  async (event) => {
    console.log("Checking for imminent hearings...");

    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + (2 * 60 * 60 * 1000));
    const todayFormatted = now.toISOString().split("T")[0];

    try {
      const snapshot = await db.collection("hearings")
        .where("hearingDate", "==", todayFormatted)
        .get();

      if (snapshot.empty) return null;

      const imminentHearings = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const [hours, minutes] = (data.hearingTime || '').split(':');
        
        if (hours && minutes) {
          const hearingTime = new Date(now);
          hearingTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          // Check if hearing is within 2 hours
          const timeDiff = hearingTime - now;
          const minutesDiff = timeDiff / (1000 * 60);
          
          // Send reminder if hearing is in 1.5 to 2 hours (within 30-minute window)
          if (minutesDiff > 90 && minutesDiff <= 120) {
            imminentHearings.push({ id: doc.id, ...data, hearingTime });
          }
        }
      });

      if (imminentHearings.length === 0) return null;

      for (const hearing of imminentHearings) {
        let message = "🚨 *URGENT: Hearing in 2 Hours!*\n\n";
        message += `⚖️ *Case:* ${hearing.caseTitle}\n`;
        message += `⏰ *Time:* ${hearing.hearingTime}\n`;
        message += `📍 *Court:* ${hearing.courtName}\n`;
        message += `👤 *Client:* ${hearing.clientName}\n\n`;
        message += "⚠️ *Leave now to reach on time!*";

        await bot.sendMessage(TELEGRAM_ADMIN_CHAT_ID, message, { parse_mode: "Markdown" });
        console.log(`✅ Imminent reminder sent for ${hearing.caseTitle}`);
      }

    } catch (error) {
      console.error("Error in imminent hearing reminder:", error);
    }

    return null;
  }
);

// ============================================
// 🔔 SEND CONSULTATION NOTIFICATION WITH CLIENT CHECK
// ============================================
exports.sendConsultationNotification = onDocumentCreated({
  document: 'consultations/{consultationId}'
}, async (event) => {
  console.log('New consultation booked — sending notifications...');

  const data = event.data?.data();
  if (!data) return null;

  const consultationId = event.params.consultationId;

  // Check if client has Telegram
  let clientChatId = null;
  if (data.phone) {
    clientChatId = await checkTelegramUser(data.phone);
  }

  // Build admin notification message
  let adminMessage = "🔔 *New Consultation Request*\n\n";
  adminMessage += `👤 *Client:* ${data.clientName || 'N/A'}\n`;
  adminMessage += `📅 *Date:* ${data.consultDate || 'N/A'}\n`;
  adminMessage += `⏰ *Time:* ${data.consultTime || 'N/A'}\n`;
  adminMessage += `📧 *Email:* ${data.email || 'N/A'}\n`;
  adminMessage += `📱 *Phone:* ${data.phone || 'N/A'}\n`;
  
  if (clientChatId) {
    adminMessage += `✅ *Client has Telegram* (notifications enabled)\n`;
  } else {
    adminMessage += `ℹ️ *Client doesn't have Telegram*\n`;
  }
  
  if (data.message) adminMessage += `\n💬 *Message:*\n${data.message}\n`;
  adminMessage += `\n🆔 *ID:* \`${consultationId}\``;

  const keyboard = {
    inline_keyboard: [[
      { text: "✅ Accept", callback_data: `accept_${consultationId}` },
      { text: "❌ Decline", callback_data: `decline_${consultationId}` }
    ]]
  };

  try {
    // Send to admin
    await bot.sendMessage(TELEGRAM_ADMIN_CHAT_ID, adminMessage, { 
      parse_mode: "Markdown",
      reply_markup: keyboard
    });

    // Send confirmation to client if they have Telegram
    if (clientChatId) {
      let clientMessage = "✅ *Consultation Request Received*\n\n";
      clientMessage += `Dear ${data.clientName},\n\n`;
      clientMessage += `Thank you for booking a consultation with MR Legal Associates.\n\n`;
      clientMessage += `📅 *Date:* ${data.consultDate}\n`;
      clientMessage += `⏰ *Time:* ${data.consultTime}\n\n`;
      clientMessage += `We will confirm your appointment shortly.\n`;
      clientMessage += `📞 Contact: +91 99662 49729`;

      await bot.sendMessage(clientChatId, clientMessage, { parse_mode: "Markdown" });
      console.log('✅ Client confirmation sent');
    }

    // Store client chat ID if available
    if (clientChatId) {
      await db.collection('consultations').doc(consultationId).update({
        clientChatId: clientChatId,
        clientHasTelegram: true
      });
    }

    console.log('✅ Consultation notifications sent');
  } catch (error) {
    console.error('❌ Error sending notifications:', error);
  }

  return null;
});

// ============================================
// 🤝 TELEGRAM WEBHOOK - HANDLE ACCEPT/DECLINE WITH CLIENT NOTIFICATION
// ============================================
exports.telegramWebhook = onRequest({
  cors: true
}, async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(200).send('Telegram Webhook Active');
      return;
    }

    const update = req.body;

    if (update.callback_query) {
      const { data, message } = update.callback_query;
      const [action, consultationId] = data.split('_');

      if (action === 'accept' || action === 'decline') {
        const consultationRef = db.collection('consultations').doc(consultationId);
        const consultationSnap = await consultationRef.get();

        if (!consultationSnap.exists) {
          await bot.answerCallbackQuery(update.callback_query.id, {
            text: '❌ Consultation not found'
          });
          res.status(200).send('OK');
          return;
        }

        const consultation = consultationSnap.data();
        const status = action === 'accept' ? 'accepted' : 'declined';

        // Update status in Firestore
        await consultationRef.update({ 
          status,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update admin message
        const emoji = action === 'accept' ? '✅' : '❌';
        const statusText = action === 'accept' ? 'ACCEPTED' : 'DECLINED';
        
        let updatedMessage = `${emoji} *Consultation ${statusText}*\n\n`;
        updatedMessage += `👤 *Client:* ${consultation.clientName}\n`;
        updatedMessage += `📅 *Date:* ${consultation.consultDate}\n`;
        updatedMessage += `⏰ *Time:* ${consultation.consultTime}\n`;
        updatedMessage += `📱 *Phone:* ${consultation.phone}\n`;
        updatedMessage += `\n*Status:* ${statusText} ✓`;

        await bot.editMessageText(updatedMessage, {
          chat_id: message.chat.id,
          message_id: message.message_id,
          parse_mode: "Markdown"
        });

        // Notify client if they have Telegram
        if (consultation.clientChatId) {
          await sendClientNotification(consultation.clientChatId, consultation, status);
        }

        await bot.answerCallbackQuery(update.callback_query.id, {
          text: `✓ Consultation ${statusText.toLowerCase()}`
        });

        console.log(`✅ Consultation ${consultationId} ${statusText}`);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error in webhook:', error);
    res.status(200).send('OK');
  }
});

// ============================================
// 🌐 CONSULTATION ACTION (Web Dashboard)
// ============================================
exports.consultationAction = onRequest({
  cors: true
}, async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { action, consultationId } = req.body;
    
    if (!action || !consultationId) {
      res.status(400).send('Missing parameters');
      return;
    }

    const consultationRef = db.collection('consultations').doc(consultationId);
    const consultationSnap = await consultationRef.get();
    
    if (!consultationSnap.exists) {
      res.status(404).send('Not found');
      return;
    }
    
    const consultation = consultationSnap.data();
    const status = action === 'accept' ? 'accepted' : 'declined';
    
    await consultationRef.update({ 
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Notify admin via Telegram
    const emoji = action === 'accept' ? '✅' : '❌';
    await bot.sendMessage(
      TELEGRAM_ADMIN_CHAT_ID, 
      `${emoji} Consultation ${status} via Dashboard\n\nClient: ${consultation.clientName}`,
      { parse_mode: "Markdown" }
    );

    // Notify client if they have Telegram
    if (consultation.clientChatId) {
      await sendClientNotification(consultation.clientChatId, consultation, status);
    }
    
    res.status(200).json({ success: true, message: `Consultation ${status}` });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error');
  }
});
