# Email Status Reference - Final Implementation

## 📊 Status Enums

### **PendingActivationEmail Model**
```javascript
status: {
    enum: ['pending', 'processing', 'retrying'],
    default: 'pending'
}
```

### **FailedEmail Model**
```javascript
status: {
    enum: ['pending', 'retrying', 'sent', 'permanent_failure'],
    default: 'pending'
}
```

---

## 🎯 Display Logic

### **1. Pending Tab (Email Queue Page)**

**Shows:** PendingActivationEmail collection  
**Status Filter:** `['pending', 'processing', 'retrying']`  
**Count:** All 3 statuses

```javascript
// Query
PendingActivationEmail.find({
    status: { $in: ['pending', 'processing', 'retrying'] }
})
```

---

### **2. Failed Tab (Email Queue Page)**

**Shows:** FailedEmail collection  
**Status Filter:** `['pending', 'retrying', 'permanent_failure']`  
**Exclude:** `'sent'` ❌

```javascript
// Query
FailedEmail.find({
    status: { $in: ['pending', 'retrying', 'permanent_failure'] }
})
```

---

### **3. Sidebar Badge Counter**

**Formula:**
```
Badge = PendingActivationEmails + FailedEmails (excluding 'sent')
```

**Code:**
```javascript
const pendingCount = await PendingActivationEmail.countDocuments({ 
    status: { $in: ['pending', 'processing', 'retrying'] } 
});

const failedCount = await FailedEmail.countDocuments({ 
    status: { $in: ['pending', 'retrying', 'permanent_failure'] } 
});

const badgeTotal = pendingCount + failedCount;
```

---

## 🔄 Status Lifecycle

### **PendingActivationEmail:**
```
Created → 'pending'
       ↓
Email being sent → 'processing'
       ↓
Success → DELETED from collection ✅
       ↓
Failure (retry) → 'retrying'
       ↓
Permanent fail → Moved to FailedEmail collection
```

### **FailedEmail:**
```
Email failed → 'pending'
       ↓
Manual retry → 'retrying'
       ↓
Success! → 'sent' (excluded from badge & tab)
       ↓
Wait 10 days...
       ↓
Cron job → DELETED ✅

OR

Too many failures → 'permanent_failure' (show in badge & tab)
```

---

## ✅ What Shows Where

| Status | Model | Pending Tab | Failed Tab | Badge |
|--------|-------|-------------|------------|-------|
| `pending` | PendingActivationEmail | ✅ | - | ✅ |
| `processing` | PendingActivationEmail | ✅ | - | ✅ |
| `retrying` | PendingActivationEmail | ✅ | - | ✅ |
| `pending` | FailedEmail | - | ✅ | ✅ |
| `retrying` | FailedEmail | - | ✅ | ✅ |
| `permanent_failure` | FailedEmail | - | ✅ | ✅ |
| `sent` | FailedEmail | - | ❌ | ❌ |

---

## 🧹 Cleanup (Cron Job)

**Schedule:** Daily at midnight (00:00)  
**Action:** Delete 'sent' emails older than 10 days

```javascript
cron.schedule('0 0 * * *', async () => {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    
    await FailedEmail.deleteMany({
        status: 'sent',
        sentAt: { $lt: tenDaysAgo }
    });
});
```

---

## 📝 Summary

### **Pending Tab:**
- Shows: PendingActivationEmail
- Statuses: `pending`, `processing`, `retrying`
- Purpose: Emails waiting to be sent

### **Failed Tab:**
- Shows: FailedEmail
- Statuses: `pending`, `retrying`, `permanent_failure`
- Excludes: `sent`
- Purpose: Emails that failed and need attention

### **Badge:**
- Counts: Pending Tab + Failed Tab
- Formula: PendingActivationEmail (all) + FailedEmail (exclude 'sent')
- Updates: Real-time via Socket.io

### **'sent' Status:**
- Hidden from: Badge & Failed Tab ❌
- Stored in: Database for 10 days (audit trail)
- Cleanup: Automatic via cron job

---

## ✅ Perfect Alignment

```
Badge Count = Pending Tab Count + Failed Tab Count
```

**Example:**
- Pending Tab: 15 emails (pending/processing/retrying)
- Failed Tab: 6 emails (pending/retrying/permanent_failure)
- Badge: 21 ✅

**'sent' emails (72) are NOT counted anywhere!** ✅

---

## 🔧 Files Modified

1. ✅ `BE/controllers/activateLeadsNew.js`
   - `getEmailQueueStatus()` - Badge count logic
   - Socket.io emission
   - Pending emails query

2. ✅ `BE/controllers/activateLeads.js`
   - `getFailedEmails()` - Failed tab query
   - `resendFailedEmails()` - Mark as 'sent' on success

3. ✅ `BE/server.js`
   - Cron job for cleanup

4. ✅ `FE/src/jsx/Admin/CRM/EmailQueue.jsx`
   - Frontend fetching logic

---

## 🎯 Result

- ✅ **Badge shows correct count** (excluding 'sent')
- ✅ **Pending tab shows all pending emails**
- ✅ **Failed tab shows all failed emails** (except 'sent')
- ✅ **'sent' emails hidden** from UI
- ✅ **Auto cleanup** after 10 days
- ✅ **Perfect alignment:** Badge = Pending + Failed

**No more confusion!** 🚀

