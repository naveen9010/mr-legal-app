// ========================================
// MR LEGAL ASSOCIATES - CLOUD FUNCTIONS
// Telegram Bot Integration
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

// ========================================
// TELEGRAM BOT CONFIGURATION
// ========================================
const TELEGRAM_BOT_TOKEN = "8418652037:AAEnpQsDeEQJhC5eDLFv8CrCGxdPHOBwWgo";
const TELEGRAM_ADMIN_CHAT_ID = "5231951393";

// Initialize Telegram Bot (polling disabled for Cloud Functions)
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

/**
 * Send formatted Telegram message to admin
 * @param {string} message - The message text (supports Telegram HTML formatting)
 * @param {object} options - Additional options (inline keyboard, etc.)
 */
async function sendTelegramNotification(message, options = {}) {
  try {
    const defaultOptions = {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      ...options
    };
    
    await bot.sendMessage(TELEGRAM_ADMIN_CHAT_ID, message, defaultOptions);
    console.log(" Telegram notification sent successfully");
    return true;
  } catch (error) {
    console.error(" Error sending Telegram notification:", error);
    return false;
  }
}
