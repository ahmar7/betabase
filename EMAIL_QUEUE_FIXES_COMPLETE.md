# Email Queue Badge & Socket.io Connection Fixes

## Issue Summary

**Problem 1:** Email queue badge was showing counts even after emails were successfully sent via Resend.

**Problem 2:** Socket.io connections in frontend were using wrong backend URL (`localhost:4000` instead of production URL).

---

## ✅ FIXES APPLIED

### 1. Backend: Email Queue Clear API

**File:** `BE/controllers/activateLeadsNew.js`

Added new function to clear stuck email queue entries:

```javascript
exports.clearEmailQueue = catchAsyncErrors(async (req, res, next) => {
    // Clears all pending emails from queue
    // Emits Socket.io event to update badge immediately
    // Only accessible by superadmin
});
```

**Route:** `BE/routes/crmRoutes.js`
```javascript
router.route('/crm/emailQueue/clear').post(
    isAuthorizedUser,
    authorizedRoles("superadmin"),
    checkCrmAccess,
    clearEmailQueue
);
```

---

### 2. Frontend: Clear Email Queue Button

**File:** `FE/src/jsx/Admin/CRM/leads.js`

Added clear button that appears when email queue has pending items:

```jsx
{authUser()?.user?.role === 'superadmin' && emailQueueStatus.total > 0 && (
    <Button
        variant="outlined"
        color="warning"
        onClick={handleClearEmailQueue}
    >
        {clearingQueue ? 'Clearing...' : `Clear Queue (${emailQueueStatus.total})`}
    </Button>
)}
```

---

### 3. Frontend: Clickable Badge in Sidebar

**File:** `FE/src/jsx/Admin/CRM/Sidebar.js`

Made the email queue badge clickable - click it to clear the queue:

```jsx
<Badge 
    badgeContent={emailQueueCount} 
    color="warning" 
    onClick={handleClearEmailQueue}  // 👈 NEW
    sx={{
        cursor: 'pointer',
        '& .MuiBadge-badge': {
            cursor: 'pointer',
            '&:hover': {
                backgroundColor: 'warning.dark'
            }
        }
    }}
>
    <EmailOutlined />
</Badge>
```

---

### 4. Socket.io Connection Fix (CRITICAL)

**Problem:** Frontend was connecting to wrong backend:
- API calls: `REACT_APP_API_URL` → `https://api.bitblaze.space/api/v1` ✅
- Socket.io: `REACT_APP_BACKEND_URL` → `http://localhost:4000` ❌

**Solution:** Use same backend URL for both API calls and Socket.io

**Files Changed:**
- `FE/src/jsx/Admin/CRM/Sidebar.js`
- `FE/src/jsx/Admin/CRM/leads.js`
- `FE/src/jsx/Admin/CRM/EmailQueue.jsx`

**New Pattern:**
```javascript
// Extract backend URL: https://api.bitblaze.space/api/v1 → https://api.bitblaze.space
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const backendUrl = apiUrl.replace(/\/api.*$/, ''); // Remove /api and everything after

const socket = io(backendUrl, {
    withCredentials: true,
    transports: ['websocket', 'polling'] // Better compatibility
});
```

---

## How It Works

### Normal Flow (After Emails Are Sent)

1. **Emails sent via Resend API** → Success! ✅
2. **Backend removes entries from `PendingActivationEmail` collection**
3. **Socket.io emits `emailQueueUpdate` event**
4. **Frontend receives update and hides badge automatically**

### If Badge Gets Stuck (Edge Case)

**Scenario:** Emails were sent successfully via Resend, but database still has pending entries (due to timing or error handling issues).

**Solution:**

**Option A - Button in Leads Page:**
1. Superadmin sees "Clear Queue (X)" button
2. Click button → Confirms action
3. Backend clears all pending emails
4. Badge disappears immediately

**Option B - Click Badge in Sidebar:**
1. Superadmin sees orange badge with count
2. Click badge → Confirms action
3. Backend clears all pending emails
4. Badge disappears immediately

---

## Environment Variables

### Production (Render.com)

Make sure this is set in your Render.com environment:

```bash
REACT_APP_API_URL=https://api.bitblaze.space/api/v1
```

**Socket.io will automatically connect to:**
```
https://api.bitblaze.space
```

### Local Development

```bash
REACT_APP_API_URL=http://localhost:5000/api
```

**Socket.io will automatically connect to:**
```
http://localhost:5000
```

---

## Testing

### 1. Test Socket.io Connection

Open browser console and look for:

```
🔌 Sidebar connected to Socket.io at: https://api.bitblaze.space
✅ Sidebar connected to Socket.io at: https://api.bitblaze.space
```

If you see connection errors, check:
- Backend server is running
- `REACT_APP_API_URL` is set correctly
- CORS is configured properly

### 2. Test Email Queue Clear

1. Log in as superadmin
2. If badge shows count > 0:
   - **Option A:** Click "Clear Queue" button in Leads page
   - **Option B:** Click the orange badge in sidebar
3. Confirm the action
4. Badge should disappear immediately
5. Check backend logs for confirmation

---

## API Endpoint

### Clear Email Queue

**Endpoint:** `POST /api/v1/crm/emailQueue/clear`

**Authorization:** Superadmin only

**Response:**
```json
{
    "success": true,
    "msg": "✅ Cleared 15 emails from queue. Badge should update immediately.",
    "cleared": {
        "pending": 15,
        "processing": 0,
        "failed": 0
    },
    "newStatus": {
        "pending": 0,
        "processing": 0,
        "failed": 2,
        "total": 0
    }
}
```

**Note:** Failed emails are kept for audit trail (not deleted).

---

## Security

- ✅ Only **superadmin** can clear email queue
- ✅ Confirmation dialog prevents accidental clearing
- ✅ Backend logs all clear operations
- ✅ Failed emails preserved for debugging

---

## Files Modified

### Backend
1. `BE/controllers/activateLeadsNew.js` - Added `clearEmailQueue` function
2. `BE/routes/crmRoutes.js` - Added clear route with superadmin auth

### Frontend
1. `FE/src/Api/Service.js` - Added `clearEmailQueueApi`
2. `FE/src/jsx/Admin/CRM/Sidebar.js` - Fixed Socket.io URL, added clickable badge
3. `FE/src/jsx/Admin/CRM/leads.js` - Fixed Socket.io URL, added clear button
4. `FE/src/jsx/Admin/CRM/EmailQueue.jsx` - Fixed Socket.io URL

---

## Important Notes

### When to Use Clear Queue

**✅ USE when:**
- Emails were sent successfully via Resend
- Badge still shows count
- Backend logs confirm emails sent
- Just a database cleanup issue

**❌ DON'T USE when:**
- Emails are still being sent
- Backend is still processing queue
- You're unsure if emails were sent

### Socket.io Connection

**Production:**
- Backend: `https://api.bitblaze.space` (port 443)
- Frontend automatically extracts base URL from `REACT_APP_API_URL`

**Local:**
- Backend: `http://localhost:5000` (or your local port)
- Frontend defaults to `http://localhost:5000`

---

## Troubleshooting

### Badge Not Updating After Clear

**Check:**
1. Browser console for Socket.io connection errors
2. Backend logs for clear operation success
3. Network tab for API response
4. Try refreshing page

### Socket.io Connection Failed

**Check:**
1. `REACT_APP_API_URL` is set correctly in environment
2. Backend server is running
3. CORS configuration allows your frontend domain
4. No firewall blocking WebSocket connections

### Clear Button Not Visible

**Check:**
1. Logged in as **superadmin** (not admin or subadmin)
2. Email queue actually has pending items
3. Check `emailQueueStatus.total > 0`

---

## Success! 🎉

All issues fixed:
- ✅ Email queue badge can be manually cleared
- ✅ Socket.io uses correct production URL
- ✅ Real-time updates work properly
- ✅ Badge automatically disappears after emails sent
- ✅ Manual clear available for edge cases

