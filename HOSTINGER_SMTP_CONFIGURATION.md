# 📧 Hostinger SMTP Configuration Guide

## 🎯 Hostinger SMTP Limits

### Official Limits:
- **Per Hour**: ~100-150 emails (varies by plan)
- **Per Day**: ~300-500 emails (varies by plan)
- **Per Minute**: Recommended max ~10-15 emails
- **Concurrent**: 1-2 connections

### Your Plan:
Check your specific limits at: Hostinger Control Panel → Emails → Settings

---

## ⚙️ Recommended Settings for Bulk Activation

### Current Settings (May Be Too Fast):
```javascript
const BATCH_SIZE = 5;              // 5 emails at once
const DELAY_BETWEEN_BATCHES = 1000; // 1 second

// Rate: 5 emails/sec = 300/minute = 18,000/hour
// ❌ WAY too fast for Hostinger!
```

### ✅ RECOMMENDED Settings for Hostinger:
```javascript
const BATCH_SIZE = 2;              // 2 emails at once
const DELAY_BETWEEN_BATCHES = 5000; // 5 seconds wait

// Rate: 2 emails/5sec = 0.4/sec = 24/minute = 1,440/hour
// ✅ Well within Hostinger limits!
```

**Or even safer:**
```javascript
const BATCH_SIZE = 1;              // 1 email at a time
const DELAY_BETWEEN_BATCHES = 3000; // 3 seconds wait

// Rate: 1 email/3sec = 0.33/sec = 20/minute = 1,200/hour
// ✅ Very safe for Hostinger
```

---

## 🔧 How to Change Settings

**File**: `BE/controllers/activateLeads.js`

**Find line ~74** and change:

```javascript
// OLD (Too fast for Hostinger):
const BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES = 1000;

// NEW (Hostinger-friendly):
const BATCH_SIZE = 2;              // ← Change to 2
const DELAY_BETWEEN_BATCHES = 5000; // ← Change to 5000 (5 seconds)
```

**Then restart backend!**

---

## 📊 Performance Comparison

| Setting | Emails/Hour | Hostinger Limit | Status |
|---------|-------------|-----------------|--------|
| **5 every 1 sec** | 18,000/hr | ~150/hr | ❌ 120x over limit! |
| **2 every 5 sec** | 1,440/hr | ~150/hr | ⚠️ Still 10x over |
| **1 every 5 sec** | 720/hr | ~150/hr | ⚠️ Still 5x over |
| **1 every 30 sec** | 120/hr | ~150/hr | ✅ Safe! |
| **1 every 60 sec** | 60/hr | ~150/hr | ✅ Very safe! |

### 🎯 Best Setting for Hostinger:

```javascript
const BATCH_SIZE = 1;               // Send one at a time
const DELAY_BETWEEN_BATCHES = 30000; // 30 seconds between emails

// Rate: 1 email/30sec = 2/minute = 120/hour
// ✅ Safely under 150/hour limit
```

**Trade-off**: Slower but reliable
- 100 emails = ~50 minutes
- But NO failures! ✅

---

## 🚨 Alternative: Use a Dedicated Email Service

### For Bulk Emails, Consider:

| Service | Free Tier | Cost | Recommended For |
|---------|-----------|------|-----------------|
| **SendGrid** | 100/day | $15/mo (40k) | ✅ Best for bulk |
| **Mailgun** | 5,000/mo | $35/mo (50k) | ✅ Great for bulk |
| **AWS SES** | 62,000/mo | $0.10/1000 | ✅ Cheapest bulk |
| **Postmark** | 100/mo | $10/mo (10k) | Email quality |
| **Hostinger** | ~150/hr | Included | ❌ Not for bulk |

**Recommendation**: If activating >50 leads/day, use SendGrid or Mailgun!

---

## 🔧 Hostinger SMTP Configuration

### .env File (`BE/config/config.env`):

```bash
# Hostinger SMTP Settings
HOST=smtp.hostinger.com
SERVICE=Hostinger
EMAIL_PORT=465
USER=your-email@yourdomain.com
PASS=your-email-password

# Or use port 587 with STARTTLS:
# EMAIL_PORT=587
```

### Common Issues:

1. **Port 465 vs 587**:
   - Port 465: SSL/TLS
   - Port 587: STARTTLS
   - Both work, but 465 is more common with Hostinger

2. **Email Format**:
   - Must use your domain email (not @gmail.com)
   - Example: admin@yourdomain.com

3. **Password**:
   - Use email account password
   - Not cPanel password!

---

## 📈 Realistic Activation Scenarios

### Scenario 1: Small Batch (10 leads)
```
Setting: 1 email / 30 seconds
Time: ~5 minutes
Hostinger: ✅ No problem
Result: All 10 emails sent successfully
```

### Scenario 2: Medium Batch (50 leads)
```
Setting: 1 email / 30 seconds
Time: ~25 minutes
Hostinger: ✅ Works fine
Result: All 50 emails sent successfully
```

### Scenario 3: Large Batch (200 leads)
```
Setting: 1 email / 30 seconds
Time: ~100 minutes (1h 40m)
Hostinger: ⚠️ Might hit hourly limit at ~100 emails

Option A: Continue slowly (safe but slow)
Option B: Switch to SendGrid for bulk
```

---

## 💡 Smart Strategy for Hostinger

### Strategy 1: Slow and Steady (Recommended)
```javascript
// Use these settings:
const BATCH_SIZE = 1;
const DELAY_BETWEEN_BATCHES = 30000; // 30 seconds

// Pros:
// ✅ Never hits Hostinger limits
// ✅ All emails delivered
// ✅ No manual resends

// Cons:
// ⏱️ Slow (100 leads = ~50 minutes)
```

### Strategy 2: Hybrid Approach
```javascript
// For small activations (<20 leads):
const BATCH_SIZE = 1;
const DELAY_BETWEEN_BATCHES = 10000; // 10 seconds
// Rate: 6/minute = safe

// For large activations (>50 leads):
// Don't send emails immediately!
// Instead:
// 1. Create users without sending
// 2. Queue emails in database
// 3. Send via cron job over 24 hours
```

### Strategy 3: Dual Provider
```javascript
// For bulk operations, check email count:
if (leadIds.length > 50) {
    // Use SendGrid/Mailgun API
    await sendViaSendGrid(emailData);
} else {
    // Use Hostinger SMTP (small batches)
    await sendEmail(emailData);
}
```

---

## 🔧 Recommended Configuration for You

**File**: `BE/controllers/activateLeads.js` (Line ~74)

### For Hostinger, Change To:

```javascript
// Hostinger-optimized settings
const BATCH_SIZE = 1;               // Send one at a time
const DELAY_BETWEEN_BATCHES = 30000; // 30 seconds between emails

// This gives you:
// - 2 emails/minute
// - 120 emails/hour
// - Safely under Hostinger's ~150/hour limit
```

**Then restart backend!**

---

## ⏱️ Time Estimates with Hostinger Settings

| Leads | Time with 30s Delay | Time with 60s Delay |
|-------|---------------------|---------------------|
| 10 | 5 minutes | 10 minutes |
| 20 | 10 minutes | 20 minutes |
| 50 | 25 minutes | 50 minutes |
| 100 | 50 minutes | 100 minutes |
| 200 | 100 minutes | 200 minutes |

**Note**: Users are created instantly! Only emails are slow.

---

## 🎯 What You Should Do

### Option A: Use Hostinger (Slower but Free)
1. Change settings to: `BATCH_SIZE = 1, DELAY = 30000`
2. Activate <100 leads at a time
3. Wait between batches
4. ✅ All emails delivered, no limits

### Option B: Add SendGrid (Fast & Reliable)
1. Sign up for SendGrid (100/day free)
2. Get API key
3. Use for bulk activations (>50)
4. ✅ Fast and reliable

### Option C: Queue Emails (Advanced)
1. Create users immediately
2. Queue emails in database
3. Send via cron job over time
4. ✅ No blocking, no limits

---

## 📝 Quick Change Guide

### Step 1: Open File
```bash
BE/controllers/activateLeads.js
```

### Step 2: Find Line ~74
```javascript
// Line 74:
const sendEmailsBatch = async (emailQueue, onProgress) => {
    const BATCH_SIZE = 5;  ← HERE
    const DELAY_BETWEEN_BATCHES = 1000;  ← AND HERE
```

### Step 3: Change Values
```javascript
const BATCH_SIZE = 1;      ← Change to 1
const DELAY_BETWEEN_BATCHES = 30000;  ← Change to 30000
```

### Step 4: Save & Restart
```bash
cd BE
# Stop (Ctrl+C)
npm start
```

### Step 5: Test
- Activate 10 leads
- Watch emails send slowly (1 every 30 seconds)
- ✅ All should succeed!
- ❌ No SMTP limit warnings!

---

## ✅ Expected Behavior with Hostinger

### With Correct Settings:
```
Activate 20 leads
  ↓
20 users created instantly ✅
  ↓
Email 1 sends... wait 30s... ✅
Email 2 sends... wait 30s... ✅
Email 3 sends... wait 30s... ✅
...
Email 20 sends ✅
  ↓
Total time: ~10 minutes
Success rate: 100% ✅
```

### With Too-Fast Settings (Current):
```
Activate 100 leads
  ↓
100 users created instantly ✅
  ↓
Emails 1-50 send quickly... ✅
  ↓
Emails 51-100 start failing... ❌
"SMTP quota exceeded"
  ↓
Frontend shows: "⚠️ SMTP Rate Limit!"
  ↓
Need to resend 50 emails manually ❌
```

---

## 🎉 Summary

**For Hostinger SMTP:**
- ✅ Change `BATCH_SIZE = 1`
- ✅ Change `DELAY = 30000` (30 seconds)
- ✅ Restart backend
- ✅ Test with small batch
- ✅ No more SMTP limits!

**Or:**
- 💡 Use SendGrid/Mailgun for bulk emails
- 💡 Keep Hostinger for transactional emails

**Your choice!** 🚀

