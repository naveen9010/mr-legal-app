# 🧪 Enhanced Telegram Features - Testing Guide

## 📋 Implementation Summary

### ✅ New Features Implemented

1. **Client Notifications via Telegram** ✅
   - Checks if client has Telegram account
   - Sends confirmation when consultation is booked
   - Sends acceptance/decline notifications to clients

2. **Two-Way Communication** ✅
   - Admin receives notifications with Accept/Decline buttons
   - Client receives confirmation when admin acts
   - Status updates synced to Firestore

3. **Daily Summary Reports** ✅
   - Scheduled at 9:00 PM IST daily
   - Shows today's consultation statistics
   - Lists tomorrow's hearings
   - Aggregates accepted, pending, declined counts

4. **Multiple Court Date Reminders** ✅
   - **1 Week Before**: Daily at 3:00 AM IST
   - **1 Day Before**: Daily at 3:00 AM IST  
   - **2 Hours Before**: Every 30 minutes check

---

## 🚀 Deployment Steps

### Step 1: Deploy to Firebase
```powershell
cd c:\With-FCM-BACKUP\mr-legal-app
firebase deploy --only functions
```

**Expected Output:**
- ✅ `dailySummaryReport` deployed
- ✅ `weeklyHearingReminder` deployed
- ✅ `dailyHearingReminder` updated
- ✅ `hearingImminentReminder` deployed
- ✅ `sendConsultationNotification` updated
- ✅ `telegramWebhook` updated
- ✅ `consultationAction` updated

---

## 🧪 Testing Plan

### Test 1: Client Notification on Booking

**Objective:** Test if client receives Telegram notification when booking

**Prerequisites:**
- Client must have Telegram and their phone number registered
- Add test client's Telegram chat ID to Firestore first

**Steps:**
1. Add test client to `telegramUsers` collection:
```powershell
# Create test user manually in Firestore:
# Collection: telegramUsers
# Document ID: 9966249729 (your phone without +)
# Field: chatId = "5231951393" (use your chat ID for testing)
```

2. Book a consultation via website with phone: +91 99662 49729

3. **Expected Results:**
   - ✅ Admin receives notification with "Client has Telegram" message
   - ✅ Admin gets Accept/Decline buttons
   - ✅ You (as test client) receive booking confirmation
   - ✅ Firestore consultation document has `clientChatId` and `clientHasTelegram: true`

---

### Test 2: Two-Way Communication

**Objective:** Verify client receives accept/decline notifications

**Steps:**
1. After booking (Test 1), click **Accept** button in admin Telegram
2. Check if you receive acceptance message as client

3. **Expected Accept Message:**
```
✅ Consultation ACCEPTED

Dear [Name],

Good news! Your consultation has been confirmed.

📅 Date: [date]
⏰ Time: [time]

📍 Please arrive 10 minutes early.
📞 Contact: +91 99662 49729

We look forward to meeting you!
```

4. Try another booking and click **Decline**

5. **Expected Decline Message:**
```
❌ Consultation DECLINED

Dear [Name],

We regret to inform you that your consultation could not be scheduled at this time.

📅 Date: [date]
⏰ Time: [time]

Please contact us to reschedule: +91 99662 49729
```

---

### Test 3: Daily Summary Report

**Objective:** Test evening summary report at 9 PM

**Option A: Wait for Scheduled Time**
- Wait until 9:00 PM IST
- Check Telegram for summary message

**Option B: Test Manually via API**
```powershell
curl -X POST https://asia-south1-mr-legal-hearings.cloudfunctions.net/dailySummaryReport
```

**Expected Message Format:**
```
📊 Daily Summary Report
📅 [Today's Date]

🔔 Today's Consultations
Total: 5
✅ Accepted: 2
⏳ Pending: 2
❌ Declined: 1

Consultation Details:
1. John Doe - accepted (2024-01-15 10:00 AM)
2. Jane Smith - pending (2024-01-15 02:00 PM)
...

⚖️ Tomorrow's Hearings
1. Case ABC vs XYZ
   ⏰ 10:30 AM | 📍 District Court

✨ Have a great evening!
```

---

### Test 4: Weekly Hearing Reminder (1 Week Before)

**Objective:** Test 7-day advance reminder

**Setup:**
1. Add test hearing exactly 7 days from today:
```
Collection: hearings
Document Fields:
- caseTitle: "Test Case - Property Dispute"
- hearingDate: "2024-01-22" (7 days from today)
- hearingTime: "10:30 AM"
- courtName: "District Court, Mumbai"
- clientName: "John Doe"
```

2. **Option A:** Wait until 3:00 AM IST tomorrow
3. **Option B:** Trigger manually (if Firebase allows direct schedule trigger)

**Expected Message:**
```
📆 1 Week Reminder

Hearings scheduled for 2024-01-22 (next week):

1. Test Case - Property Dispute
   📍 District Court, Mumbai
   ⏰ 10:30 AM
   👤 John Doe

⚠️ Please prepare documents and case files
```

---

### Test 5: Daily Hearing Reminder (1 Day Before)

**Objective:** Test tomorrow's hearing reminder

**Setup:**
1. Add test hearing for tomorrow:
```
Collection: hearings
- caseTitle: "Urgent Case - Land Acquisition"
- hearingDate: [Tomorrow's date in YYYY-MM-DD]
- hearingTime: "11:00 AM"
- courtName: "High Court, Delhi"
- clientName: "Jane Smith"
- judgeName: "Justice Kumar"
```

2. Wait until 3:00 AM IST

**Expected Message:**
```
⚖️ Tomorrow's Hearing Reminder

📅 2024-01-16

1. Urgent Case - Land Acquisition
   📍 High Court, Delhi
   ⏰ 11:00 AM
   👤 Client: Jane Smith
   ⚖️ Judge: Justice Kumar

🔔 Final preparations reminder!
```

---

### Test 6: Imminent Hearing Reminder (2 Hours Before)

**Objective:** Test 2-hour advance urgent reminder

**Setup:**
1. Add hearing for today, 2 hours from now:
```
Collection: hearings
- caseTitle: "Emergency Bail Application"
- hearingDate: [Today's date YYYY-MM-DD]
- hearingTime: "[Current time + 2 hours]" (e.g., if now is 10:00 AM, set 12:00 PM)
- courtName: "Session Court, Chennai"
- clientName: "Robert Brown"
```

2. Wait 30-60 minutes (function runs every 30 min)

**Expected Message:**
```
🚨 URGENT: Hearing in 2 Hours!

⚖️ Case: Emergency Bail Application
⏰ Time: 12:00 PM
📍 Court: Session Court, Chennai
👤 Client: Robert Brown

⚠️ Leave now to reach on time!
```

---

## 📊 Verification Checklist

After all tests:

### ✅ Functionality Checks
- [ ] Client receives booking confirmation if they have Telegram
- [ ] Admin sees "Client has Telegram" indicator
- [ ] Accept button sends confirmation to client
- [ ] Decline button sends decline message to client
- [ ] Daily summary shows accurate statistics
- [ ] Weekly reminder triggers 7 days before
- [ ] Daily reminder triggers 1 day before
- [ ] Imminent reminder triggers 2 hours before
- [ ] All messages use proper formatting (Markdown)
- [ ] Firestore updates happen correctly

### ✅ Firestore Checks
- [ ] `consultations` have `clientChatId` and `clientHasTelegram` fields
- [ ] `notificationLogs` collection logs daily summaries
- [ ] Status updates (accepted/declined) are recorded

### ✅ Edge Cases
- [ ] Client without Telegram still gets admin notification
- [ ] Multiple hearings on same day show correctly
- [ ] No hearings = appropriate "No hearings" message
- [ ] Empty consultation list handled gracefully

---

## 🐛 Troubleshooting

### Issue: Client not receiving notifications
**Solution:**
1. Verify `telegramUsers` collection has client's phone (without +)
2. Check chat ID is correct
3. Ensure client hasn't blocked bot
4. Test with `bot.sendMessage(chatId, "test")` manually

### Issue: Reminders not firing
**Solution:**
1. Check function logs: `firebase functions:log`
2. Verify timezone is `Asia/Kolkata`
3. Ensure hearing dates are in correct format (YYYY-MM-DD)
4. Check hearing time format (HH:MM AM/PM or 24-hour)

### Issue: Daily summary empty
**Solution:**
1. Verify consultations have `createdAt` timestamp
2. Check date range query (today 00:00 to 23:59)
3. Ensure hearings have correct `hearingDate` field

---

## 📝 Manual Testing Commands

### Test Sending Message to Client
```javascript
const chatId = "5231951393"; // Your test chat ID
const message = "Test client notification";
await bot.sendMessage(chatId, message);
```

### Test Checking Telegram User
```javascript
const phone = "9966249729";
const chatId = await checkTelegramUser(phone);
console.log("Chat ID:", chatId);
```

### Query Today's Consultations
```javascript
const today = new Date();
const todayStart = new Date(today.setHours(0, 0, 0, 0));
const snapshot = await db.collection("consultations")
  .where("createdAt", ">=", todayStart)
  .get();
console.log("Count:", snapshot.size);
```

---

## 🎯 Success Criteria

**All features working if:**
1. ✅ Client with Telegram gets all notifications
2. ✅ Admin gets detailed reports at scheduled times
3. ✅ Two-way communication flows smoothly
4. ✅ All 4 reminder types fire correctly
5. ✅ No errors in Firebase logs
6. ✅ Firestore data updates properly

---

## 📞 Support

If any test fails:
1. Check Firebase Functions logs
2. Verify Telegram bot token is active
3. Ensure webhook is set correctly
4. Check Firestore permissions
5. Review console.log outputs

**Next Steps After Testing:**
- Monitor for 24-48 hours
- Check all scheduled functions fire
- Collect user feedback
- Optimize message formatting if needed
