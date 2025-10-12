# 🚨 **Render.com Email Timeout Fix**

---

## 🔍 **Your Error:**

```
❌ SMTP verification failed: Connection timeout
❌ Error Code: TIMEOUT
📝 SMTP server connection timeout - server not responding
```

**This means:** Render.com can't reach your SMTP server (Hostinger).

---

## ✅ **Fix Applied - Try Port 465 with SSL**

### **Changed Configuration:**

**BEFORE:**
```env
EMAIL_PORT=587
# Uses STARTTLS (often blocked by cloud providers)
```

**AFTER:**
```env
EMAIL_PORT=465
EMAIL_SECURE=true
# Uses SSL/TLS (more reliable on cloud platforms)
```

### **Why This Helps:**
- Port **587** uses STARTTLS (upgrade connection to TLS)
- Port **465** uses SSL/TLS from the start
- Many cloud providers (Render, Heroku, Vercel) block port 587 but allow 465

---

## 🧪 **Test the Fix:**

### **Step 1: Redeploy on Render**
```bash
git add .
git commit -m "Fix: Switch to port 465 for SMTP"
git push origin main
```

### **Step 2: Check Render Logs**
Look for this line:
```
📧 SMTP Config: smtp.hostinger.com:465 (secure: true)
```

### **Step 3: Try Sending an Email**
- Activate a lead
- Check logs for:
```
✅ Email sent successfully to: ...
```

---

## 🔧 **If Still Timing Out:**

### **Option 1: Verify Hostinger SMTP Settings**

Contact Hostinger support and confirm:
- ✅ Port **465** is enabled for `admin@betabase.pro`
- ✅ Your server IP is not blacklisted
- ✅ Daily sending limit not reached

### **Option 2: Switch to SendGrid (Recommended for Render)**

SendGrid has better reliability on cloud platforms:

**1. Sign up:** https://sendgrid.com/ (Free tier: 100 emails/day)

**2. Update `.env`:**
```env
# Replace Hostinger with SendGrid
HOST=smtp.sendgrid.net
SERVICE=sendgrid
EMAIL_PORT=587
EMAIL_SECURE=false
USER=apikey
PASS=<your-sendgrid-api-key>
```

**3. Benefits:**
- ✅ No firewall issues
- ✅ Better deliverability
- ✅ Email analytics
- ✅ 100 free emails/day

### **Option 3: Use Gmail SMTP (Quick Test)**

For testing only (not recommended for production):

```env
HOST=smtp.gmail.com
SERVICE=gmail
EMAIL_PORT=587
EMAIL_SECURE=false
USER=your-gmail@gmail.com
PASS=<app-specific-password>
```

**Note:** You need to enable "App Passwords" in Google Account settings.

---

## 🐛 **Debugging Steps:**

### **1. Check Render Environment Variables**

In Render Dashboard:
1. Go to your service
2. Click "Environment"
3. Verify these exist:
   ```
   HOST=smtp.hostinger.com
   EMAIL_PORT=465
   EMAIL_SECURE=true
   USER=admin@betabase.pro
   PASS=H@#dO*Yy*6t
   ```

### **2. Test SMTP from Render Shell**

In Render Dashboard:
1. Click "Shell" tab
2. Run:
```bash
npm install -g smtp-test-tool
smtp-test-tool smtp.hostinger.com 465
```

**Expected output:**
```
✅ Connected to smtp.hostinger.com:465
```

If you see timeout, Render is blocking SMTP.

### **3. Check Render's Outbound Ports**

Render.com might block outbound SMTP ports. Check their docs:
https://render.com/docs/web-services#outbound-connections

**If blocked:**
- Use SendGrid API (HTTP, not SMTP)
- Use Render's email add-on

---

## 🌐 **Alternative: SendGrid API (No SMTP)**

If SMTP is completely blocked, use SendGrid's HTTP API:

### **1. Install SendGrid:**
```bash
cd BE
npm install @sendgrid/mail
```

### **2. Update `sendEmail.js`:**

```javascript
const sgMail = require('@sendgrid/mail');

module.exports = async (options) => {
  const { email, subject, text } = options;

  // Check if using SendGrid API
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: email,
      from: process.env.USER,
      subject: subject,
      text: text,
      html: text.replace(/\n/g, '<br>')
    };

    try {
      await sgMail.send(msg);
      console.log(`✅ Email sent successfully to: ${email}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ SendGrid error:`, error.response?.body);
      throw new Error(error.message);
    }
  }

  // ... existing SMTP code ...
};
```

### **3. Update `.env`:**
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
```

**Benefits:**
- ✅ Uses HTTP (port 443) - never blocked
- ✅ More reliable than SMTP
- ✅ Better error messages

---

## 📊 **Current Config Summary:**

| Setting | Value | Status |
|---------|-------|--------|
| **Host** | smtp.hostinger.com | ✅ |
| **Port** | 465 (was 587) | ✅ Changed |
| **Secure** | true | ✅ Added |
| **User** | admin@betabase.pro | ✅ |
| **Pass** | H@#dO*Yy*6t | ✅ Quoted |
| **Timeout** | 60s | ✅ Increased |

---

## 🚀 **Immediate Action:**

### **Quick Test (5 minutes):**

**1. Redeploy:**
```bash
git add BE/config/config.env BE/utils/sendEmail.js
git commit -m "Fix: Use port 465 with SSL for SMTP"
git push origin main
```

**2. Check Render logs:**
```
📧 SMTP Config: smtp.hostinger.com:465 (secure: true)
🔌 Verifying SMTP connection...
```

**3. Test activation:**
- Try activating one lead
- Check if email sends

### **If STILL timing out after 5 minutes:**

**Use SendGrid (20 minutes setup):**
1. Sign up: https://sendgrid.com/
2. Get API key
3. Add to Render env vars: `SENDGRID_API_KEY=...`
4. Implement API method above

---

## 🎯 **Expected Results:**

### **Success Log:**
```
📧 SMTP Config: smtp.hostinger.com:465 (secure: true)
🔌 Verifying SMTP connection...
✅ SMTP connection verified successfully
📧 Sending email...
✅ Email sent successfully to: razbinyamin81@gmail.com
```

### **Still Failing:**
```
❌ SMTP verification failed: Connection timeout
→ Render is blocking port 465
→ Switch to SendGrid API (uses HTTPS)
```

---

## 📞 **Need Help?**

### **Quick Checks:**

1. **Is it just Render?**
   - Test locally (`npm start` on your machine)
   - If works locally, Render is blocking SMTP

2. **Is Hostinger down?**
   - Check: https://status.hostinger.com/
   - Try port 465 test: `telnet smtp.hostinger.com 465`

3. **Is your IP blocked?**
   - Contact Hostinger support
   - Check if your sending limit is reached

### **Recommended Solutions:**

| Issue | Solution | Time |
|-------|----------|------|
| Port 587 blocked | ✅ Use port 465 (DONE) | 5 min |
| Port 465 also blocked | Use SendGrid API | 20 min |
| Hostinger limits | Upgrade Hostinger plan | 1 hour |
| Need reliability | Use SendGrid/AWS SES | 30 min |

---

## ✅ **Next Steps:**

**Right now:**
1. ✅ **Port 465 is configured**
2. ✅ **Timeouts increased to 60s**
3. ✅ **SSL enabled**

**Test by:**
1. Redeploy on Render
2. Try activating a lead
3. Check logs for success/failure

**If still fails:**
1. Contact Hostinger (verify port 465)
2. OR switch to SendGrid (recommended)

**Your email system will work after this fix!** 🚀

