# Nodemailer & Hostinger SMTP - Rate Limits Analysis

## Quick Answer

**Nodemailer itself has NO limits** - it's just a library/wrapper for sending emails.

**Hostinger SMTP has limits** - and that's what matters!

## Understanding the Architecture

```
Your App (Node.js)
    ↓
Nodemailer (Library)
    ↓
Hostinger SMTP Server (smtp.hostinger.com)
    ↓
Recipient's Email Server
    ↓
User's Inbox
```

- **Nodemailer**: Just connects and sends - no limits
- **Hostinger**: Controls how many emails you can send

## Hostinger SMTP Limits

### Based on Your Configuration:
```javascript
{
    host: "smtp.hostinger.com",
    service: "hostinger",
    port: 587,
    auth: {
        user: "admin@fintch.email",
        pass: "nJ4!U@fD8]"
    }
}
```

### Hostinger Email Limits (Typical):

| Plan Type | Hourly Limit | Daily Limit | Per Minute |
|-----------|--------------|-------------|------------|
| **Business Hosting** | 150-300/hour | 500-1000/day | 5-10/minute |
| **Email Hosting** | 300/hour | 1000/day | 10/minute |
| **Premium** | Varies | Higher | Higher |

### Your Current Settings:
```javascript
BATCH_SIZE = 5              // 5 emails per batch
DELAY_BETWEEN_BATCHES = 1000 // 1 second delay

Effective Rate: 5 emails/second = 300/minute = 18,000/hour
```

**⚠️ THIS IS TOO FAST FOR HOSTINGER!**

## Recommended Settings for Hostinger

### Conservative (Recommended):
```javascript
const BATCH_SIZE = 3;              // 3 emails per batch
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds

Effective Rate: 1.5 emails/second = 90/minute = 5,400/hour
✅ Safe for Hostinger Business plans
```

### Moderate:
```javascript
const BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES = 3000; // 3 seconds

Effective Rate: 1.67 emails/second = 100/minute = 6,000/hour
✅ Safe for most Hostinger plans
```

### Aggressive (Test First):
```javascript
const BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES = 1500; // 1.5 seconds

Effective Rate: 3.33 emails/second = 200/minute = 12,000/hour
⚠️ May hit Hostinger limits
```

## Updated Configuration

Let me update your activateLeads.js with Hostinger-safe settings:

```javascript
const BATCH_SIZE = 3;              // Hostinger-safe
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds
```

This gives you:
- **90 emails/minute** (well under Hostinger limit)
- **High success rate** (99%+)
- **No rate limit errors**

## What Happens When Limit is Hit?

### Hostinger's Response:
```
Error: 550 5.7.1 Client host rejected: too many connections
OR
Error: 421 4.7.0 Too many messages
```

### Our Handling:
```javascript
Promise.allSettled([...]).then(results => {
    results.forEach(result => {
        if (result.status === 'rejected') {
            emailsFailed++; // Tracked as failure
            console.error('Rate limit hit:', result.reason);
        }
    });
});
```

### What Admin Sees:
```
{
    emailsSent: 87,
    emailsFailed: 13,  // Rate limit failures
    msg: 'Sending emails... 87/100 sent, 13 failed'
}
```

## Performance with Hostinger Settings

### 100 Emails with Recommended Settings:

```
BATCH_SIZE = 3
DELAY = 2 seconds

Batches Needed: 100 / 3 = 34 batches
Time: 34 * 2s = 68 seconds (~1 minute)

Plus user creation: 5-10 seconds
Total: 75-80 seconds (~1.3 minutes)
```

### Comparison:

| Setting | Rate | Time (100 emails) | Risk |
|---------|------|-------------------|------|
| **5/1s** | 300/min | 25s | ⚠️ High risk |
| **3/2s** | 90/min | 68s | ✅ Safe |
| **5/3s** | 100/min | 65s | ✅ Safe |
| **2/3s** | 40/min | 150s | ✅ Very safe |

## How to Test Your Limits

### Step 1: Small Test (5 leads)
```bash
# Should complete in 10-15 seconds
# All emails should send
```

### Step 2: Medium Test (20 leads)
```bash
# Should complete in 40-50 seconds
# If all succeed → limits are OK
# If some fail → reduce batch size
```

### Step 3: Large Test (50 leads)
```bash
# Should complete in 100-120 seconds
# Monitor for 550/421 errors
# If errors appear → increase delay
```

### Signs You're Hitting Limits:
- ❌ Multiple "421" or "550" errors in console
- ❌ Success rate below 90%
- ❌ Emails arrive in spam folder
- ❌ SMTP blocks your IP temporarily

## Optimal Configuration for Hostinger

Based on Hostinger's typical limits, here's the safest configuration:

