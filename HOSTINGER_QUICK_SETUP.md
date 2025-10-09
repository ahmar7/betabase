# ⚡ Hostinger SMTP - Quick Setup

## 🎯 For Hostinger smtp.hostinger.com

### Recommended Settings:

**File**: `BE/controllers/activateLeads.js` (Line ~74)

```javascript
const BATCH_SIZE = 1;               // Send 1 email at a time
const DELAY_BETWEEN_BATCHES = 30000; // Wait 30 seconds
```

**Why?**
- Hostinger limit: ~100-150 emails/hour
- This setting: 120 emails/hour
- ✅ Safe!

---

## 📧 Hostinger SMTP Config

**File**: `BE/config/config.env`

```env
HOST=smtp.hostinger.com
SERVICE=Hostinger
EMAIL_PORT=465
USER=your-email@yourdomain.com
PASS=your-email-password
```

**Important**:
- Must use email address **on your domain** (not @gmail.com)
- Example: `admin@yourcompany.com`
- Password is your **email account password**

---

## ⏱️ Activation Times with Hostinger

| Leads | Users Created | Email Sending Time |
|-------|---------------|-------------------|
| 10 | Instant | ~5 minutes |
| 20 | Instant | ~10 minutes |
| 50 | Instant | ~25 minutes |
| 100 | Instant | ~50 minutes |

**Note**: Users are created instantly! Only emails are slow.

---

## 🚨 If You Need Faster

### Option 1: Activate in Smaller Batches
- Activate 20 at a time
- Wait 1 hour between batches
- Respects hourly limits

### Option 2: Use SendGrid (Free 100/day)
```bash
npm install @sendgrid/mail
```

**Better for bulk!**

---

## ✅ Quick Setup Steps

1. **Update batch settings**:
   ```javascript
   // BE/controllers/activateLeads.js, line 74:
   const BATCH_SIZE = 1;
   const DELAY_BETWEEN_BATCHES = 30000;
   ```

2. **Restart backend**:
   ```bash
   cd BE
   npm start
   ```

3. **Test with 10 leads**:
   - Should take ~5 minutes
   - All emails should send successfully
   - No SMTP limit warnings

4. **For larger batches**:
   - Activate max 100 leads at a time
   - Wait 1 hour before next batch
   - Or switch to SendGrid

---

## 🎉 Done!

Your activation feature is now **optimized for Hostinger**! 🚀

**Safe settings:**
- ✅ Won't hit limits
- ✅ All emails delivered
- ✅ No manual resends needed

**Just slower - but reliable!** ⏱️✅

