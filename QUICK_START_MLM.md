# MLM Referral System - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Generate Referral Codes for Existing Users
Run this command **ONCE** to backfill referral codes:
```bash
cd D:\betabase
node BE/utils/generateReferralCodesForExistingUsers.js
```

Expected output:
```
Connecting to database...
✓ Database connected successfully

Found 150 users without referral codes

[1/150] ✓ Generated code A1B2C3D4 for John Doe (john@example.com)
[2/150] ✓ Generated code E5F6G7H8 for Jane Smith (jane@example.com)
...

Summary:
  Total Users: 150
  Success: 150
  Failed: 0
```

### Step 2: Grant Admin Permission
Enable an admin to manage referrals:

**Option A: Via MongoDB Compass**
```javascript
// Find your admin user
db.users.findOne({ email: "admin@yoursite.com" })

// Update permissions
db.users.updateOne(
  { email: "admin@yoursite.com" },
  { $set: { "adminPermissions.canManageReferrals": true } }
)
```

**Option B: Via Superadmin Dashboard** (if implemented)
- Go to Admin Management
- Edit admin user
- Enable "Can Manage Referrals" permission

### Step 3: Test the System

#### Test User Flow:
1. Login as a user
2. Go to "Refer & Earn" page
3. Copy your referral code (e.g., `ABCD1234`)
4. Logout
5. Register new user with URL: `http://localhost:3000/auth/register?ref=ABCD1234`
6. Complete registration
7. New user should see "Referred by [Your Name]"

#### Test Admin Flow:
1. Login as admin
2. Go to "Referral Management"
3. You should see the new user with status "inactive"
4. Click activate button
5. Enter commission: `100`
6. Click "Activate & Pay Commission"
7. Success! Referrer now has $100 commission

#### Verify:
1. Login as the original user (referrer)
2. Go to "My Affiliate" dashboard
3. You should see:
   - Total Referrals: 1
   - Active: 1
   - Total Earned: $100
   - Earnings tab shows commission from new user

---

## 🎯 All Pages & Links

### For Users:
- **Promo Page**: `/user/referral-promo` (Sidebar: "Refer & Earn")
- **Dashboard**: `/user/affiliate` (Sidebar: "My Affiliate")

### For Admins:
- **Management**: `/admin/referrals` (Sidebar: "Referral Management")

### Public:
- **Register with Code**: `/auth/register?ref=YOURCODE`

---

## 📱 Features Overview

### User Can:
- ✅ Get unique referral code automatically
- ✅ Share code via link or copy button
- ✅ View referral tree (visual hierarchy)
- ✅ See all referred friends
- ✅ Track commission earnings
- ✅ See active vs inactive referrals

### Admin Can:
- ✅ View all referrals system-wide
- ✅ Search and filter users
- ✅ Activate inactive users
- ✅ Set commission amounts manually
- ✅ Add manual commissions
- ✅ View system statistics
- ✅ See top referrers leaderboard

---

## 🎨 Marketing Copy

**Promo Page Text:**
```
Turn your friends into crypto buddies and your invites into cash!

Share your unique code and get $100 for every friend who signs up and starts trading.

The more you refer, the more you earn — it's that simple.

Let's make crypto social — invite, earn, repeat!
```

---

## 🔧 Configuration

### Backend Environment Variables
In `BE/config/config.env`:
```
DBLINK=mongodb://your-connection-string
FRONTEND_URL=http://localhost:3000
```

### Frontend Environment Variables
In `FE/.env`:
```
REACT_APP_API_URL=/api/v1
```

---

## 🎯 Success Indicators

System is working correctly when:

✅ **Registration**
- New users can enter referral code
- Valid codes show "✓ Valid" with referrer name
- Invalid codes show warning

✅ **User Dashboard**
- Referral code displays correctly
- Copy button works
- Referral list shows all referred friends
- Tree visualizes hierarchy
- Earnings show correct amounts

✅ **Admin Dashboard**
- Can see all referrals
- Search and filter work
- Activate button changes status
- Commission is added to referrer
- Statistics are accurate

---

## 🐛 Troubleshooting

### Issue: Migration script fails
**Solution**: Check MongoDB connection string in `.env`

### Issue: Admin can't see Referral Management
**Solution**: 
```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { "adminPermissions.canManageReferrals": true } }
)
```

### Issue: Referral code not working
**Solution**: 
- Check if backend is running
- Verify `/api/v1/referral/verify/:code` endpoint
- Check browser console for errors

### Issue: Commission not showing
**Solution**:
- Ensure user was activated by admin
- Check `commissionsPaid` array in database
- Verify earnings API is being called

---

## ✨ That's It!

Your MLM Referral System is **fully functional** and **ready to use**!

Users can now:
- 🎁 Refer friends
- 💰 Earn commissions
- 📊 Track their network

Admins can:
- ⚙️ Manage all referrals
- 💸 Set commissions
- 📈 Monitor growth

**Happy referring!** 🚀


## 🚀 Get Started in 3 Steps

### Step 1: Generate Referral Codes for Existing Users
Run this command **ONCE** to backfill referral codes:
```bash
cd D:\betabase
node BE/utils/generateReferralCodesForExistingUsers.js
```

Expected output:
```
Connecting to database...
✓ Database connected successfully

Found 150 users without referral codes

[1/150] ✓ Generated code A1B2C3D4 for John Doe (john@example.com)
[2/150] ✓ Generated code E5F6G7H8 for Jane Smith (jane@example.com)
...

Summary:
  Total Users: 150
  Success: 150
  Failed: 0
```

### Step 2: Grant Admin Permission
Enable an admin to manage referrals:

**Option A: Via MongoDB Compass**
```javascript
// Find your admin user
db.users.findOne({ email: "admin@yoursite.com" })

// Update permissions
db.users.updateOne(
  { email: "admin@yoursite.com" },
  { $set: { "adminPermissions.canManageReferrals": true } }
)
```

**Option B: Via Superadmin Dashboard** (if implemented)
- Go to Admin Management
- Edit admin user
- Enable "Can Manage Referrals" permission

### Step 3: Test the System

#### Test User Flow:
1. Login as a user
2. Go to "Refer & Earn" page
3. Copy your referral code (e.g., `ABCD1234`)
4. Logout
5. Register new user with URL: `http://localhost:3000/auth/register?ref=ABCD1234`
6. Complete registration
7. New user should see "Referred by [Your Name]"

#### Test Admin Flow:
1. Login as admin
2. Go to "Referral Management"
3. You should see the new user with status "inactive"
4. Click activate button
5. Enter commission: `100`
6. Click "Activate & Pay Commission"
7. Success! Referrer now has $100 commission

#### Verify:
1. Login as the original user (referrer)
2. Go to "My Affiliate" dashboard
3. You should see:
   - Total Referrals: 1
   - Active: 1
   - Total Earned: $100
   - Earnings tab shows commission from new user

---

## 🎯 All Pages & Links

### For Users:
- **Promo Page**: `/user/referral-promo` (Sidebar: "Refer & Earn")
- **Dashboard**: `/user/affiliate` (Sidebar: "My Affiliate")

### For Admins:
- **Management**: `/admin/referrals` (Sidebar: "Referral Management")

### Public:
- **Register with Code**: `/auth/register?ref=YOURCODE`

---

## 📱 Features Overview

### User Can:
- ✅ Get unique referral code automatically
- ✅ Share code via link or copy button
- ✅ View referral tree (visual hierarchy)
- ✅ See all referred friends
- ✅ Track commission earnings
- ✅ See active vs inactive referrals

### Admin Can:
- ✅ View all referrals system-wide
- ✅ Search and filter users
- ✅ Activate inactive users
- ✅ Set commission amounts manually
- ✅ Add manual commissions
- ✅ View system statistics
- ✅ See top referrers leaderboard

---

## 🎨 Marketing Copy

**Promo Page Text:**
```
Turn your friends into crypto buddies and your invites into cash!

Share your unique code and get $100 for every friend who signs up and starts trading.

The more you refer, the more you earn — it's that simple.

Let's make crypto social — invite, earn, repeat!
```

---

## 🔧 Configuration

### Backend Environment Variables
In `BE/config/config.env`:
```
DBLINK=mongodb://your-connection-string
FRONTEND_URL=http://localhost:3000
```

### Frontend Environment Variables
In `FE/.env`:
```
REACT_APP_API_URL=/api/v1
```

---

## 🎯 Success Indicators

System is working correctly when:

✅ **Registration**
- New users can enter referral code
- Valid codes show "✓ Valid" with referrer name
- Invalid codes show warning

✅ **User Dashboard**
- Referral code displays correctly
- Copy button works
- Referral list shows all referred friends
- Tree visualizes hierarchy
- Earnings show correct amounts

✅ **Admin Dashboard**
- Can see all referrals
- Search and filter work
- Activate button changes status
- Commission is added to referrer
- Statistics are accurate

---

## 🐛 Troubleshooting

### Issue: Migration script fails
**Solution**: Check MongoDB connection string in `.env`

### Issue: Admin can't see Referral Management
**Solution**: 
```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { "adminPermissions.canManageReferrals": true } }
)
```

### Issue: Referral code not working
**Solution**: 
- Check if backend is running
- Verify `/api/v1/referral/verify/:code` endpoint
- Check browser console for errors

### Issue: Commission not showing
**Solution**:
- Ensure user was activated by admin
- Check `commissionsPaid` array in database
- Verify earnings API is being called

---

## ✨ That's It!

Your MLM Referral System is **fully functional** and **ready to use**!

Users can now:
- 🎁 Refer friends
- 💰 Earn commissions
- 📊 Track their network

Admins can:
- ⚙️ Manage all referrals
- 💸 Set commissions
- 📈 Monitor growth

**Happy referring!** 🚀

