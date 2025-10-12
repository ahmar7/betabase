# 🐛 Debug Email Queue - What to Look For

## 📊 What the Console Logs Will Show

### On Server Startup:
```
📧 ========================================
📧 Starting background email queue processor...
📧 ========================================

📊 Initial queue status:
   ├─ Pending: 10
   ├─ Processing: 0
   ├─ Failed: 2
   └─ Total: 10

📤 [WORKER] Processing 10 pending emails...

📧 [1/10] Processing: john@example.com
   ├─ Step 1: Marking as processing...
   ├─ Step 2: Status marked as processing (attempt #1)
   ├─ Step 3: Sending email...
   ├─ Step 4: Email sent successfully! ✅
   ├─ Step 5: Removing from pending queue...
   └─ ✅ Email removed from queue
   └─ 📡 Socket.io update emitted (pending: 9, failed: 2)

📧 [2/10] Processing: jane@example.com
   ├─ Step 1: Marking as processing...
   ├─ Step 2: Status marked as processing (attempt #1)
   ├─ Step 3: Sending email...
   ├─ ❌ Error occurred while sending email
   ├─ Error message: SMTP rate limit exceeded
   ├─ Error code: EAUTH
   ├─ Step 6: Moving to failed emails collection...
   ├─ ✅ Added to failed emails collection
   ├─ Step 7: Removing from pending queue...
   └─ ✅ Removed from pending queue
   └─ 📡 Socket.io update emitted (failed count: 3)

✅ [WORKER] Batch complete: 8 sent, 2 failed

📧 ========================================
📧 Initial email queue check complete
📧 Worker will run every 30 seconds
📧 ========================================
```

---

## 🔍 What to Check If Emails Are Stuck in "Processing"

### Check 1: Backend Console Logs

Look for:
```
📧 [X/Y] Processing: email@example.com
   ├─ Step 1: Marking as processing...
   ├─ Step 2: Status marked as processing (attempt #1)
   ├─ Step 3: Sending email...
   [STUCK HERE?] ← If you don't see Step 4 or error, email is hanging
```

**If stuck at Step 3:**
- SMTP server not responding (timeout)
- Network issue
- Email server down

**Solution**: Email will timeout eventually and move to failed

---

### Check 2: Stuck Processing Reset

If emails are stuck, the worker will auto-reset them:

```
⚠️ Found 5 emails stuck in processing - resetting to pending
```

**This runs when:**
- No pending emails found
- But processing emails exist
- Resets processing → pending
- They'll be tried again next cycle

---

### Check 3: MongoDB Direct Check

Run these in MongoDB Compass or CLI:

```javascript
// Check pending emails
db.pendingactivationemails.find({ status: 'pending' })

// Check processing emails
db.pendingactivationemails.find({ status: 'processing' })

// Check failed emails
db.failedemails.find({})

// If emails stuck in processing > 5 minutes, reset them:
db.pendingactivationemails.updateMany(
  { 
    status: 'processing',
    lastAttempt: { $lt: new Date(Date.now() - 5*60*1000) }  // Older than 5 min
  },
  { 
    $set: { status: 'pending' }
  }
)
```

---

## 🔧 Common Issues & Solutions

### Issue 1: Emails Stuck in Processing

**Symptom:**
```
Pending: 0
Processing: 10  ← Stuck here!
Failed: 0
```

**Possible Causes:**
1. SMTP server timeout (email hanging)
2. Network issue
3. Worker crashed mid-process

**Solution:**
1. Wait for next worker cycle (30 seconds)
2. Worker will reset stuck processing → pending
3. Or manually reset in MongoDB (see above)

---

### Issue 2: All Emails Failing

**Symptom:**
```
📧 [1/10] Processing: email@example.com
   ├─ Step 3: Sending email...
   ├─ ❌ Error occurred while sending email
   ├─ Error message: SMTP authentication failed
```

**Possible Causes:**
1. Wrong SMTP credentials
2. SMTP rate limit exceeded
3. SMTP server blocking

**Solution:**
1. Check `.env` file (HOST, USER, PASS, SERVICE)
2. Check SMTP provider (daily limit, rate limit)
3. Wait 1 hour and try again (rate limits usually reset)

---

### Issue 3: Worker Not Running

**Symptom:**
- No logs in console
- Badge count not decreasing
- Emails stay pending forever

**Solution:**
1. Check server console for worker startup logs
2. Restart backend server
3. Check MongoDB connection

---

### Issue 4: Socket.io Not Updating

**Symptom:**
- Emails sending (console shows success)
- Badge not updating in frontend
- Need to refresh to see changes

**Solution:**
1. Check browser console for Socket.io connection:
   ```
   🔌 Sidebar connected to Socket.io
   ```
2. Check backend console for emission:
   ```
   📡 Socket.io update emitted (pending: 9, failed: 2)
   ```
3. Check CORS settings in server.js
4. Verify FRONTEND_URL in .env

---

## 📋 Quick Diagnostic Commands

### Backend Console:
```bash
# Watch backend logs in real-time
# You should see worker logs every 30 seconds

# Look for:
📤 [WORKER] Processing X pending emails...
✅ [WORKER] Batch complete: X sent, Y failed
```

### Frontend Console:
```javascript
// Check Socket.io connection
// Should see:
🔌 Sidebar connected to Socket.io
📧 Email queue update: {pending: 45, processing: 5, failed: 3}

// If not connected:
// Check REACT_APP_BACKEND_URL in .env
```

### MongoDB Commands:
```javascript
// Count pending
db.pendingactivationemails.countDocuments({ status: 'pending' })

// Count processing (should be 0 or low)
db.pendingactivationemails.countDocuments({ status: 'processing' })

// Count failed
db.failedemails.countDocuments()

// See all pending with details
db.pendingactivationemails.find().pretty()
```

---

## 🔑 What Each Step Means

```
Step 1: Marking as processing
  → Update MongoDB status: pending → processing
  → Prevents other workers from picking it up

Step 2: Status marked as processing
  → Confirms update successful
  → Shows attempt number

Step 3: Sending email
  → Calling nodemailer
  → Connecting to SMTP server
  → Sending email message
  [If stuck here = SMTP timeout or hanging]

Step 4: Email sent successfully
  → SMTP confirmed email sent ✅

Step 5: Removing from pending queue
  → Delete from PendingActivationEmail collection

Step 6: Moving to failed emails (on error)
  → Create record in FailedEmail collection
  → Stores error message

Step 7: Removing from pending queue (after fail)
  → Cleanup - prevents stuck state
```

---

## 🚨 Critical Error Scenarios

### Scenario 1: Email Stuck at Step 3

**What to look for:**
```
📧 [1/10] Processing: email@example.com
   ├─ Step 1: Marking as processing...
   ├─ Step 2: Status marked as processing (attempt #1)
   ├─ Step 3: Sending email...
   [NOTHING - STUCK HERE]
```

**What's happening:**
- SMTP server not responding
- Email is hanging
- Will timeout eventually (usually 30-60 seconds)

**What to do:**
- Wait for timeout
- Email will move to failed
- Check SMTP server status
- Check network connectivity

---

### Scenario 2: Critical Cleanup Failure

**What to look for:**
```
   └─ 💥 CRITICAL: Cannot remove from pending queue: [error]
```

**What's happening:**
- Email failed to send
- Failed to add to failed collection
- Failed to remove from pending
- **EMAIL IS TRULY STUCK**

**What to do:**
1. Manually delete from MongoDB:
   ```javascript
   db.pendingactivationemails.deleteOne({ email: "stuck@example.com" })
   ```
2. Check MongoDB connection
3. Restart server

---

## ✅ Healthy System Indicators

You should see:

1. **Worker runs every 30 seconds:**
   ```
   📤 [WORKER] Processing X pending emails...
   ✅ [WORKER] Batch complete: X sent, Y failed
   ```

2. **Queue decreases over time:**
   ```
   Pending: 100 → 50 → 0
   ```

3. **Socket.io updates emit:**
   ```
   📡 Socket.io update emitted (pending: 9, failed: 2)
   ```

4. **Frontend badge updates:**
   ```
   Email Queue (100) → (95) → (90) → ... → (0)
   ```

5. **No stuck processing emails:**
   ```
   Processing: 0 (or very low number)
   ```

---

## 🎯 Summary

### What I Added:

1. ✅ **Detailed step-by-step logging** - See exactly where it's stuck
2. ✅ **Stuck processing reset** - Auto-reset stuck emails to pending
3. ✅ **Better error extraction** - Shows actual SMTP errors
4. ✅ **Force delete on critical errors** - Prevents infinite stuck state
5. ✅ **Startup status display** - See queue state on server start
6. ✅ **Nested error handling** - Cleanup failures won't crash worker

### Now You Can:

✅ **See exactly where emails get stuck** (Step 1-7)
✅ **Auto-recovery from stuck state** (reset to pending)
✅ **Detailed error messages** (not "Unknown error")
✅ **Monitor worker health** (logs every 30 seconds)
✅ **Diagnose issues quickly** (clear step labels)

---

**Run the backend and check the console logs - you'll see exactly what's happening at each step!** 🔍


