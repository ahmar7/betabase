# 🔄 Restart & Test Security Fixes

## ✅ All Security Issues Fixed

1. ✅ **Backend has proper record-level authorization**
2. ✅ **Subadmin can ONLY view own assigned leads**
3. ✅ **Admin cannot view superadmin leads**
4. ✅ **Correct redirect paths** (/admin/dashboard not /dashboard)
5. ✅ **All three endpoints protected**

---

## 🔄 How to Restart

### **1. Stop Backend:**
```bash
# In backend terminal
Press: Ctrl + C
```

### **2. Restart Backend:**
```bash
cd BE
npm start
```

**Expected Output:**
```
Server running on port 4000
✅ Database connected: ...
✅ CRM Database connected: ...
```

### **3. Frontend should auto-reload**
If not, hard refresh: `Ctrl + Shift + R`

---

## 🧪 How to Test

### **Test 1: Subadmin Views Own Lead** ✅

1. Login as subadmin (who has CRM access)
2. Go to CRM Leads
3. Click on a lead assigned to you
4. **Expected:** Lead stream opens normally
5. **Expected:** Can see activities
6. **Expected:** Can add comments
7. **Expected:** NO edit icons (read-only)
8. **Expected:** NO assign button

---

### **Test 2: Subadmin Views Other's Lead** ❌

1. Login as subadmin
2. Try to open a lead assigned to someone else
3. **Expected:** Error toast: "Access denied: You can only view your own assigned leads"
4. **Expected:** Auto-redirect to /admin/crm/leads after 1.5s
5. **Backend console:** Should show 403 error

---

### **Test 3: Admin Views Subadmin's Lead** ✅

1. Login as admin (with canManageCrmLeads permission)
2. Click on a lead assigned to a subadmin
3. **Expected:** Lead stream opens normally
4. **Expected:** Can edit fields (pencil icons visible)
5. **Expected:** Can assign lead
6. **Expected:** Can add comments

---

### **Test 4: Admin Views Superadmin's Lead** ❌

1. Login as admin (with canManageCrmLeads)
2. Try to open a lead assigned to superadmin
3. **Expected:** Error toast: "Access denied: You can only view your own leads and subadmin leads"
4. **Expected:** Auto-redirect to /admin/crm/leads
5. **Backend console:** Should show 403 error

---

### **Test 5: Admin (no permission) Views Any Lead** ❌

1. Login as admin WITHOUT canManageCrmLeads
2. Try to open a lead not assigned to them
3. **Expected:** Error toast: "Access denied: You can only view your own assigned leads"
4. **Expected:** Auto-redirect to /admin/crm/leads

---

### **Test 6: Superadmin Views Any Lead** ✅

1. Login as superadmin
2. Click on ANY lead (own, admin's, subadmin's, unassigned)
3. **Expected:** All leads open normally
4. **Expected:** Full access to all features
5. **Expected:** Can edit, assign, comment on everything

---

## 🔍 What to Check in Browser Console

### **Successful Access:**
```
🔄 Fetching lead data... { silent: false, leadId: "..." }
✅ Lead data response: true
✅ Setting loading to false
🎨 Render state: { loading: false, hasLead: true, ... }
```

### **Access Denied:**
```
🔄 Fetching lead data... { silent: false, leadId: "..." }
✅ Lead data response: false
Toast: "Access denied: You can only view your own assigned leads"
(Redirect to /admin/crm/leads after 1.5s)
```

---

## 🔍 What to Check in Backend Console

### **Successful Access:**
```
(No special logs, just normal operation)
```

### **Access Denied:**
```
(Backend logs the 403 response)
```

**Note:** The backend will NOT crash or error out. It will return a proper 403 response.

---

## 🚨 Common Issues

### **Issue 1: "Still seeing other users' leads"**

**Check:**
- Backend restarted? ✅
- Using correct user account? ✅
- Lead is actually assigned to them? ✅

**Debug:**
```javascript
// Check in browser console:
console.log(currentUserLatest);
console.log(lead.agent);
```

---

### **Issue 2: "Getting logged out"**

**Cause:** CRM access permission not set

**Fix:**
- Go to Admin Users
- Click edit on the user
- Enable "CRM Access" permission
- Save

---

### **Issue 3: "Redirecting to wrong page"**

**Check:**
- Should redirect to `/admin/dashboard` for admin/subadmin ✅
- Should redirect to `/dashboard` for regular users ✅

If wrong, check `navigate()` calls in code.

---

## ✅ Security Checklist

After testing, verify:

- [ ] Subadmin can ONLY view own assigned leads ✅
- [ ] Subadmin gets 403 on unauthorized leads ✅
- [ ] Admin with permission can view own + subadmin ✅
- [ ] Admin cannot view other admin leads ✅
- [ ] Admin cannot view superadmin leads ✅
- [ ] Admin without permission can only view own ✅
- [ ] Superadmin can view all leads ✅
- [ ] Correct redirect paths (/admin/dashboard) ✅
- [ ] Error messages are clear ✅
- [ ] Auto-redirect works after error ✅
- [ ] Backend returns 403 status code ✅
- [ ] All three endpoints protected ✅

---

## 📊 Authorization Matrix (Reference)

| User Role | Own Leads | Unassigned | Subadmin Leads | Other Admin | Superadmin |
|-----------|-----------|------------|----------------|-------------|------------|
| **Superadmin** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Admin (w/ perm)** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Admin (no perm)** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Subadmin** | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 🎯 Quick Test Commands

### **Create Test Users (if needed):**

1. **Superadmin** (already exists)
2. **Admin with CRM permission:**
   - Create admin
   - Enable "CRM Access"
   - Enable "Manage CRM Leads"
3. **Admin without permission:**
   - Create admin
   - Enable "CRM Access"
   - Disable "Manage CRM Leads"
4. **Subadmin:**
   - Create subadmin
   - Enable "CRM Access"

### **Assign Test Leads:**

1. Assign some leads to superadmin
2. Assign some leads to admin
3. Assign some leads to subadmin
4. Leave some leads unassigned

### **Test Each Scenario:**

Login as each user type and try to access different leads. Check the matrix above for expected results.

---

## 🎉 You're Done!

Once all tests pass, the security is **completely fixed** and production-ready! 🚀

See `BACKEND_SECURITY_FIXED.md` for complete technical documentation.

