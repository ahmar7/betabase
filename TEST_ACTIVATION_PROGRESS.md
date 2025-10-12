# How to Test Activation Progress Fixes

## Setup
1. Make sure backend is running on `http://localhost:4000`
2. Make sure frontend is running
3. Have some test leads in the system

## Test Scenarios

### Test 1: Basic Activation Flow ✅
**Steps**:
1. Go to Leads page
2. Select 2-3 leads
3. Click "Activate" button
4. Confirm activation

**Expected**:
- ✅ Progress tracker appears in bottom-right
- ✅ Shows real-time progress (users created, emails sent)
- ✅ Progress updates every 2 seconds
- ✅ Shows 100% when complete
- ✅ Auto-closes after 2 minutes

---

### Test 2: Dismiss with X Button 🆗
**Steps**:
1. Start activation as in Test 1
2. Click the X button on the progress tracker
3. Refresh the page

**Expected**:
- ✅ Progress tracker closes immediately
- ✅ After refresh, tracker does NOT reappear (even if not 100% complete)
- ✅ sessionId is added to dismissed list in localStorage

**Check localStorage**:
```javascript
// Open browser console
JSON.parse(localStorage.getItem('dismissedActivationSessions'))
// Should show array with your dismissed sessionId
```

---

### Test 3: Auto-Close After Completion ⏰
**Steps**:
1. Start activation
2. Wait for 100% completion
3. Wait 2 minutes without clicking anything

**Expected**:
- ✅ Progress shows "Completed" status
- ✅ After exactly 2 minutes, tracker auto-closes
- ✅ localStorage cleaned up
- ✅ Tracker doesn't reappear on refresh

---

### Test 4: Refresh During Activation 🔄
**Steps**:
1. Start activation of 5+ leads
2. While activation is running (e.g., at 40%), refresh the page
3. Observe the progress tracker

**Expected**:
- ✅ Progress tracker reappears automatically
- ✅ Shows current progress (not starting from 0%)
- ✅ Continues updating from backend
- ✅ Completes normally

---

### Test 5: Start New Activation (Old One Showing) 🆕
**Steps**:
1. Start first activation (A)
2. Let it complete but DON'T close it
3. Select different leads
4. Start second activation (B)

**Expected**:
- ✅ Old tracker (A) disappears automatically
- ✅ Old sessionId added to dismissed list
- ✅ New tracker (B) appears
- ✅ Only ONE tracker visible at a time
- ❌ NO overlapping dialogs

---

### Test 6: Multiple Refresh + New Activation 🔄🔄
**Steps**:
1. Start activation A → let complete → refresh page
2. Start activation B → refresh page
3. Start activation C → refresh page

**Expected**:
- ✅ Each refresh shows ONLY the current/recent activation
- ✅ Old dismissed activations don't reappear
- ✅ localStorage has max 50 dismissed sessions

**Check localStorage**:
```javascript
const dismissed = JSON.parse(localStorage.getItem('dismissedActivationSessions'));
console.log(dismissed.length); // Should be <= 50
```

---

### Test 7: 404 Handling (Backend Not Ready) 🔍
**Steps**:
1. Start activation
2. Open browser DevTools → Network tab
3. Observe API calls to `/api/v1/crm/activation/progress/:sessionId`

**Expected**:
- ✅ May see a few 404 errors initially (session being created)
- ✅ Polling continues despite 404s
- ✅ After ~5-10 seconds, 200 OK responses appear
- ✅ Progress updates normally
- ❌ Polling doesn't stop on first 404

**If 404s persist**:
- After 5 consecutive 404s (10 seconds), polling stops
- Error message shown: "Session not found"

---

### Test 8: Dismissed Session Persistence 💾
**Steps**:
1. Start activation
2. Click X to dismiss
3. Close browser completely
4. Reopen browser and navigate to Leads page

**Expected**:
- ✅ Dismissed tracker does NOT reappear
- ✅ dismissedActivationSessions persists in localStorage

---

### Test 9: Clean Up Old Dismissed Sessions 🗑️
**Steps**:
```javascript
// Manually add 60 old sessions to localStorage
const oldSessions = Array.from({length: 60}, (_, i) => `old_session_${i}`);
localStorage.setItem('dismissedActivationSessions', JSON.stringify(oldSessions));

// Refresh page or start new activation
```

**Expected**:
- ✅ Only last 50 sessions remain in localStorage
- ✅ Oldest 10 sessions automatically removed

---

## Debug Commands

### Check Current Progress
```javascript
JSON.parse(localStorage.getItem('activationProgress'))
```

### Check Dismissed Sessions
```javascript
JSON.parse(localStorage.getItem('dismissedActivationSessions'))
```

### Clear Everything (Reset)
```javascript
localStorage.removeItem('activationProgress');
localStorage.removeItem('dismissedActivationSessions');
location.reload();
```

### Manually Trigger Progress Event
```javascript
window.dispatchEvent(new StorageEvent('storage', {
    key: 'activationProgress',
    newValue: JSON.stringify({
        sessionId: 'test_123',
        total: 10,
        activated: 5,
        emailsSent: 3,
        percentage: 50,
        completed: false
    })
}));
```

---

## Expected Console Logs

### On Mount
```
📦 Loaded progress from localStorage: {sessionId: "...", ...}
🔍 SessionId found, fetching fresh data from backend...
📦 Backend response on mount: {success: true, data: {...}}
✅ Using fresh backend data: {...}
🔔 Starting backend polling for session: activation_...
```

### During Polling
```
🌐 Fetching progress from backend...
📦 Backend API response: {success: true, data: {...}}
✅ Received backend progress: {...}
💾 Updating localStorage with backend data: {...}
📊 Backend data changed, updating state
```

### On Completion
```
🏁 Activation completed, stopping polling
⏰ Starting auto-close timer (2 minutes)
```

### On Dismiss (X Click)
```
❌ Closing progress tracker
🚫 Session was dismissed, not showing: activation_...
```

### On 404 Errors
```
⚠️ 404: Session not found - may be starting... (1/5)
⚠️ 404: Session not found - may be starting... (2/5)
...
❌ Too many consecutive 404s, stopping polling
```

---

## Common Issues & Solutions

### Issue: Tracker doesn't appear
**Solution**: Check browser console for errors. Verify localStorage has `activationProgress` key.

### Issue: 404 errors won't stop
**Solution**: This is expected initially. Wait ~10 seconds for backend to create session.

### Issue: Tracker reappears after dismissal
**Solution**: Check if sessionId is in `dismissedActivationSessions` array. Clear localStorage and try again.

### Issue: Multiple trackers visible
**Solution**: This shouldn't happen anymore. Clear localStorage and refresh if it does.

### Issue: Auto-close doesn't work
**Solution**: Wait full 2 minutes. Check browser console for timer logs.

---

## Success Criteria

All tests pass if:
- ✅ No overlapping progress dialogs
- ✅ Dismissed trackers stay dismissed
- ✅ Completed progress auto-closes after 2 minutes
- ✅ Refresh during activation works correctly
- ✅ New activation clears old progress
- ✅ 404 errors handled gracefully
- ✅ localStorage doesn't grow indefinitely

---

**Test Date**: _____________
**Tested By**: _____________
**Result**: ☐ Pass ☐ Fail
**Notes**: _________________________________________________



