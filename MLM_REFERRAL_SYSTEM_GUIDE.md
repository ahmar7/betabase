# MLM/Referral System - Complete Implementation Guide

## 🎯 System Overview

The MLM (Multi-Level Marketing) Referral System is a friend-referring-a-friend mechanism that allows users to earn commissions by referring new members to the platform.

### Key Features:
- ✅ **Unique Referral Codes**: Each user gets a unique 8-character alphanumeric code
- ✅ **Referral Tracking**: New users are linked to their referrer
- ✅ **Status Management**: Users can be Active or Inactive (managed by admin)
- ✅ **Commission System**: Admin sets commission amounts manually
- ✅ **User Dashboard**: View referral tree, list, and earnings
- ✅ **Admin Dashboard**: Activate users, manage commissions, view statistics
- ✅ **Permission-Based**: Only admins with `canManageReferrals` permission can manage
- ✅ **Beautiful Promo Page**: Eye-catching promotional landing page

---

## 📁 File Structure

### Backend Files

#### 1. **BE/models/userModel.js**
- Added MLM fields to user schema:
  - `referralCode` - Unique code for each user
  - `referredBy` - Reference to the user who referred them
  - `affiliateStatus` - 'active' or 'inactive'
  - `directReferrals` - Array of referred users
  - `totalCommissionEarned` - Total earnings
  - `commissionsPaid` - Array of commission records
- Added `canManageReferrals` to `adminPermissions`
- Added `generateReferralCode()` method

#### 2. **BE/controllers/referralController.js**
User Endpoints:
- `verifyReferralCode` - Public endpoint to verify code validity
- `getMyReferralCode` - Get user's referral code and link
- `getMyReferralTree` - Get hierarchical referral tree
- `getMyReferrals` - Get list of direct referrals
- `getMyEarnings` - Get commission earnings overview

Admin Endpoints:
- `getAllReferrals` - Get all referred users with filters
- `getSystemStatistics` - Get system-wide referral stats
- `getUserReferralDetails` - Get specific user's referral info
- `activateUserAndSetCommission` - Activate user & pay referrer
- `updateUserAffiliateStatus` - Change user status
- `addCommissionManually` - Add manual commission

#### 3. **BE/routes/userRoute.js**
- Added `/referral/*` routes for both user and admin endpoints

#### 4. **BE/controllers/userController.js**
- Updated `RegisterUser` to handle referral codes
- Links new users to referrers
- Generates referral code for new users
- Updates referrer's `directReferrals` array

#### 5. **BE/utils/generateReferralCodesForExistingUsers.js**
- One-time utility script to generate codes for existing users
- Run with: `node BE/utils/generateReferralCodesForExistingUsers.js`

### Frontend Files

#### 1. **FE/src/jsx/pages/authentication/Registration.jsx**
- Added referral code input field (optional)
- Real-time code verification
- Displays referrer info when valid code entered
- Accepts code from URL parameter: `?ref=ABCD1234`

#### 2. **FE/src/jsx/pages/user/ReferralPromo.jsx**
- Beautiful promotional landing page
- Gradient hero section with engaging copy
- Stats cards showing referrals and earnings
- Copy/share functionality for referral code
- "How It Works" section

#### 3. **FE/src/jsx/pages/user/AffiliateDashboard.jsx**
- Complete user dashboard for referral system
- Three tabs: Referrals List, Referral Tree, Earnings
- Visual referral tree hierarchy
- Commission history table
- Real-time stats (total, active, inactive, earnings)

#### 4. **FE/src/jsx/Admin/ReferralManagement.jsx**
- Admin interface for managing referrals
- Two tabs: Referrals List, Statistics
- Search and filter functionality
- Activate users and set commissions
- Add manual commissions
- View detailed user referral info
- Top referrers leaderboard

#### 5. **FE/src/jsx/layouts/nav/Menu.jsx**
- Added "Refer & Earn" link (promo page)
- Added "My Affiliate" link (dashboard)

#### 6. **FE/src/jsx/layouts/AdminSidebar/Sidebar.js**
- Added "Referral Management" link
- Permission-based visibility (superadmin or `canManageReferrals`)

#### 7. **FE/src/config/router.js**
- Added user routes: `/user/referral-promo`, `/user/affiliate`
- Added admin route: `/admin/referrals`

---

## 🔐 Permissions

### Admin Permission: `canManageReferrals`
- Located in `userModel.adminPermissions.canManageReferrals`
- Can be granted/revoked by superadmin
- Controls access to:
  - Admin Referral Management page
  - All admin referral API endpoints
  - Ability to activate users
  - Ability to set commissions

### Role-Based Access:
- **Superadmin**: Full access to all referral features
- **Admin**: Access only if `canManageReferrals = true`
- **User**: Can view own referrals and earnings only

---

## 🔄 User Flow

### 1. **Registration with Referral Code**
```
User A (existing) → Shares code "ABCD1234"
↓
User B (new) → Visits /auth/register?ref=ABCD1234
↓
System verifies code → Shows "Referred by User A"
↓
User B completes registration
↓
User B gets referralCode "EFGH5678"
↓
User B.referredBy = User A._id
↓
User B.affiliateStatus = "inactive"
↓
User A.directReferrals.push(User B._id)
```

### 2. **Admin Activation Process**
```
Admin logs in → Goes to /admin/referrals
↓
Sees User B (status: inactive)
↓
Clicks "Activate & Set Commission"
↓
Enters commission amount ($100)
↓
System:
  - User B.affiliateStatus = "active"
  - User A.commissionsPaid.push({
      fromUserId: User B._id,
      amount: 100,
      status: 'paid'
    })
  - User A.totalCommissionEarned += 100
```

### 3. **User Views Earnings**
```
User A logs in → Goes to /user/affiliate
↓
Views Earnings Tab:
  - Total Earned: $100
  - Commission from: User B - $100
  - Status: Paid
```

---

## 📊 Database Schema Changes

### User Model - New Fields:

```javascript
{
  // Unique referral code for this user
  referralCode: String (unique, uppercase, indexed)
  
  // Who referred this user
  referredBy: ObjectId (ref: 'user')
  
  // User's affiliate status
  affiliateStatus: Enum ['inactive', 'active']
  
  // Direct referrals (children)
  directReferrals: [ObjectId] (ref: 'user')
  
  // Total commission earned
  totalCommissionEarned: Number
  
  // Commission records
  commissionsPaid: [{
    fromUserId: ObjectId,
    fromUserName: String,
    fromUserEmail: String,
    amount: Number,
    status: Enum ['pending', 'paid'],
    approvedBy: ObjectId,
    approvedByName: String,
    notes: String,
    createdAt: Date,
    paidAt: Date
  }]
}
```

---

## 🚀 API Endpoints

### Public Endpoints
```
GET /api/v1/referral/verify/:code
  - Verify if referral code is valid
  - Returns referrer info if valid
```

### User Endpoints (Authenticated)
```
GET /api/v1/referral/my-code
  - Get user's own referral code and link

GET /api/v1/referral/my-tree
  - Get referral tree (hierarchical view)

GET /api/v1/referral/my-referrals
  - Get list of direct referrals with stats

GET /api/v1/referral/my-earnings
  - Get commission earnings breakdown
```

### Admin Endpoints (Authenticated + Permission)
```
GET /api/v1/referral/admin/all
  - Get all referrals (paginated, searchable, filterable)

GET /api/v1/referral/admin/statistics
  - Get system-wide referral statistics

GET /api/v1/referral/admin/user/:userId
  - Get specific user's referral details

POST /api/v1/referral/admin/activate/:userId
  - Activate user and set commission for referrer
  - Body: { commissionAmount, notes }

PATCH /api/v1/referral/admin/status/:userId
  - Update user's affiliate status
  - Body: { status: 'active' | 'inactive' }

POST /api/v1/referral/admin/commission/:userId
  - Add manual commission to user
  - Body: { amount, notes, fromUserName }
```

---

## 🎨 UI Pages

### User Pages

#### 1. **Refer & Earn (Promo Page)** - `/user/referral-promo`
- Eye-catching promotional design
- Gradient hero section
- Displays referral code prominently
- Copy/share functionality
- Stats overview
- "How It Works" section
- CTA to affiliate dashboard

#### 2. **My Affiliate Dashboard** - `/user/affiliate`
- **Stats Cards**: Total, Active, Inactive, Total Earned
- **Three Tabs**:
  1. **Referrals List**: Table of all referred users
  2. **Referral Tree**: Hierarchical visual tree
  3. **Earnings**: Commission breakdown and history

### Admin Pages

#### 3. **Referral Management** - `/admin/referrals`
- **Two Tabs**:
  1. **Referrals**: 
     - Searchable/filterable table
     - View user details
     - Activate users
     - Add commissions
  2. **Statistics**:
     - Total referrals
     - Active/inactive counts
     - Commission overview (paid/pending/total)
     - Top referrers leaderboard

---

## 🎯 Key Functionalities

### 1. **Referral Code Generation**
- Automatic on user registration
- 8-character hexadecimal, uppercase
- Uniqueness guaranteed
- Available via `user.generateReferralCode()`

### 2. **Registration with Referral**
- URL parameter support: `?ref=CODE`
- Manual input field (optional)
- Real-time verification
- Visual feedback (✓ Valid)

### 3. **Activation Process**
```
Inactive User → Admin activates → Referrer gets commission
```
- Only inactive users can be activated
- Must have a referrer (`referredBy` not null)
- Admin sets commission amount manually
- Instant update to referrer's earnings

### 4. **Commission Types**
- **Activation Commission**: Paid when referred user is activated
- **Manual Commission**: Admin can add anytime for any reason
- Status: 'paid' or 'pending'

### 5. **Referral Tree**
- Shows 2 levels deep
- Visual hierarchy
- Color-coded status (green=active, yellow=inactive)

---

## 🔧 Setup Instructions

### 1. **Database Migration**
Run the utility script to generate codes for existing users:
```bash
node BE/utils/generateReferralCodesForExistingUsers.js
```

### 2. **Grant Admin Permissions**
To allow an admin to manage referrals, superadmin must set:
```javascript
adminPermissions.canManageReferrals = true
```

This can be done via:
- `/api/v1/admin/:id/permissions` endpoint
- Directly in database
- Admin permission management page

### 3. **Environment Variables**
Ensure these are set in `BE/config/config.env`:
```
DBLINK=your_mongodb_connection_string
FRONTEND_URL=http://localhost:3000
```

### 4. **Frontend Environment**
In `.env` or build config:
```
REACT_APP_API_URL=/api/v1
```

---

## 📝 Usage Examples

### User Sharing Referral Link
```
1. User logs in
2. Goes to "Refer & Earn" page
3. Copies referral link: 
   https://yoursite.com/auth/register?ref=ABCD1234
4. Shares on social media or sends to friends
5. Views affiliate dashboard to track referrals
```

### Admin Activating a Referral
```
1. Admin logs in
2. Goes to "Referral Management"
3. Sees new inactive referral
4. Clicks "Activate" button
5. Enters commission amount: $100
6. Adds note: "First deposit bonus"
7. Clicks "Activate & Pay Commission"
8. System:
   - Sets user to active
   - Adds $100 to referrer's account
   - Creates commission record
```

### Admin Adding Manual Commission
```
1. Admin opens "Referral Management"
2. Finds a referrer
3. Clicks "Add Commission"
4. Enters amount: $50
5. Adds reason: "Special bonus for 5 referrals"
6. Submits
7. Referrer sees new commission in earnings
```

---

## 🎨 Design Theme

The system uses a consistent dark theme across all pages:

**Colors:**
- Primary Purple: `#667eea` → `#764ba2` (gradient)
- Success Green: `#10b981`
- Warning Orange: `#f59e0b`
- Background Dark: `#1A1D29`
- Card Background: `#242833`
- Border: `#2d3142`
- Text Muted: `#8b92a7`
- Text White: `#FFFFFF`

**Components:**
- Material-UI (MUI) components
- Consistent border radius: 12-16px
- Smooth transitions and hover effects
- Responsive grid layout
- Mobile-friendly dialogs and tables

---

## ✅ Testing Checklist

### User Side:
- [ ] New user can register with referral code
- [ ] Invalid referral code shows error
- [ ] User receives unique referral code on registration
- [ ] Referral code visible on promo page
- [ ] Copy/share functionality works
- [ ] Affiliate dashboard shows correct data
- [ ] Referral tree displays properly
- [ ] Earnings tab shows commissions

### Admin Side:
- [ ] Admin with permission can access management page
- [ ] Admin without permission cannot access
- [ ] Search and filters work correctly
- [ ] Activate user dialog functions
- [ ] Commission is added to referrer correctly
- [ ] Statistics tab shows accurate data
- [ ] Top referrers list is sorted correctly

### Backend:
- [ ] Referral codes are unique
- [ ] Registration with code links users correctly
- [ ] API endpoints respect permissions
- [ ] Commission calculations are accurate
- [ ] Database relationships maintain integrity

---

## 🔐 Security Considerations

1. **Permission Checks**: All admin endpoints verify `canManageReferrals`
2. **Code Uniqueness**: Multiple attempts to ensure no duplicates
3. **Input Validation**: Commission amounts must be positive
4. **User Verification**: Can't activate without referrer
5. **Status Guards**: Can't activate already active users

---

## 🚧 Important Notes

### Database:
- Works on **MAIN database only** (not CRM)
- Uses `userModel` from main database
- All mongoose operations use main connection

### Referral Code Format:
- 8 characters
- Hexadecimal (0-9, A-F)
- Uppercase
- Example: `A1B2C3D4`

### Commission Logic:
- **Inactive** = Pending approval by admin
- **Active** = Approved and commission can be paid
- Admin **manually** determines commission amounts
- No automatic commission calculation

### Important Behaviors:
- Users start as 'inactive' regardless of referral
- Only admin can change status to 'active'
- Commission is paid to the **referrer**, not the referee
- Referral tree shows 2 levels deep for performance

---

## 📞 Support & Troubleshooting

### Common Issues:

**Q: User doesn't have a referral code**
A: Run `node BE/utils/generateReferralCodesForExistingUsers.js`

**Q: Admin can't see Referral Management**
A: Check `adminPermissions.canManageReferrals` is `true`

**Q: Referral code not working in registration**
A: Ensure `/api/v1/referral/verify/:code` endpoint is accessible (no auth required)

**Q: Commissions not showing**
A: Check if user is activated and commission was set by admin

**Q: Referral tree not loading**
A: Check browser console for API errors, verify token is valid

---

## 🎉 Success Metrics

Track these KPIs:
- Total users with referral codes
- Total referred users
- Conversion rate (inactive → active)
- Average commission per activation
- Top referrers
- Total commissions paid

---

## 🔄 Future Enhancements (Optional)

Possible improvements:
1. Multi-level commissions (referrer of referrer)
2. Automatic commission rules based on deposit amount
3. Referral rewards/bonuses for milestones
4. Email notifications for new referrals
5. Referral analytics and charts
6. Bulk activation with CSV upload
7. Commission payout history export
8. Custom commission rates per user

---

## 📋 Quick Start Guide

### For Users:
1. Login to your account
2. Click "Refer & Earn" in sidebar
3. Copy your referral code or link
4. Share with friends
5. Track referrals in "My Affiliate" dashboard

### For Admins:
1. Login as admin/superadmin
2. Ensure you have `canManageReferrals` permission
3. Click "Referral Management" in sidebar
4. View all referrals
5. Click "Activate" on inactive users
6. Enter commission amount
7. View statistics tab for system overview

---

## 💡 Marketing Copy

**The promotional text:**
> Turn your friends into crypto buddies and your invites into cash!
> 
> Share your unique code and get $100 for every friend who signs up and starts trading.
> 
> The more you refer, the more you earn — it's that simple.
> 
> Let's make crypto social — invite, earn, repeat!

---

## 📞 Contact

For issues or questions about the MLM system, contact the development team.

**Last Updated**: October 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready


## 🎯 System Overview

The MLM (Multi-Level Marketing) Referral System is a friend-referring-a-friend mechanism that allows users to earn commissions by referring new members to the platform.

### Key Features:
- ✅ **Unique Referral Codes**: Each user gets a unique 8-character alphanumeric code
- ✅ **Referral Tracking**: New users are linked to their referrer
- ✅ **Status Management**: Users can be Active or Inactive (managed by admin)
- ✅ **Commission System**: Admin sets commission amounts manually
- ✅ **User Dashboard**: View referral tree, list, and earnings
- ✅ **Admin Dashboard**: Activate users, manage commissions, view statistics
- ✅ **Permission-Based**: Only admins with `canManageReferrals` permission can manage
- ✅ **Beautiful Promo Page**: Eye-catching promotional landing page

---

## 📁 File Structure

### Backend Files

#### 1. **BE/models/userModel.js**
- Added MLM fields to user schema:
  - `referralCode` - Unique code for each user
  - `referredBy` - Reference to the user who referred them
  - `affiliateStatus` - 'active' or 'inactive'
  - `directReferrals` - Array of referred users
  - `totalCommissionEarned` - Total earnings
  - `commissionsPaid` - Array of commission records
- Added `canManageReferrals` to `adminPermissions`
- Added `generateReferralCode()` method

#### 2. **BE/controllers/referralController.js**
User Endpoints:
- `verifyReferralCode` - Public endpoint to verify code validity
- `getMyReferralCode` - Get user's referral code and link
- `getMyReferralTree` - Get hierarchical referral tree
- `getMyReferrals` - Get list of direct referrals
- `getMyEarnings` - Get commission earnings overview

Admin Endpoints:
- `getAllReferrals` - Get all referred users with filters
- `getSystemStatistics` - Get system-wide referral stats
- `getUserReferralDetails` - Get specific user's referral info
- `activateUserAndSetCommission` - Activate user & pay referrer
- `updateUserAffiliateStatus` - Change user status
- `addCommissionManually` - Add manual commission

#### 3. **BE/routes/userRoute.js**
- Added `/referral/*` routes for both user and admin endpoints

#### 4. **BE/controllers/userController.js**
- Updated `RegisterUser` to handle referral codes
- Links new users to referrers
- Generates referral code for new users
- Updates referrer's `directReferrals` array

#### 5. **BE/utils/generateReferralCodesForExistingUsers.js**
- One-time utility script to generate codes for existing users
- Run with: `node BE/utils/generateReferralCodesForExistingUsers.js`

### Frontend Files

#### 1. **FE/src/jsx/pages/authentication/Registration.jsx**
- Added referral code input field (optional)
- Real-time code verification
- Displays referrer info when valid code entered
- Accepts code from URL parameter: `?ref=ABCD1234`

#### 2. **FE/src/jsx/pages/user/ReferralPromo.jsx**
- Beautiful promotional landing page
- Gradient hero section with engaging copy
- Stats cards showing referrals and earnings
- Copy/share functionality for referral code
- "How It Works" section

#### 3. **FE/src/jsx/pages/user/AffiliateDashboard.jsx**
- Complete user dashboard for referral system
- Three tabs: Referrals List, Referral Tree, Earnings
- Visual referral tree hierarchy
- Commission history table
- Real-time stats (total, active, inactive, earnings)

#### 4. **FE/src/jsx/Admin/ReferralManagement.jsx**
- Admin interface for managing referrals
- Two tabs: Referrals List, Statistics
- Search and filter functionality
- Activate users and set commissions
- Add manual commissions
- View detailed user referral info
- Top referrers leaderboard

#### 5. **FE/src/jsx/layouts/nav/Menu.jsx**
- Added "Refer & Earn" link (promo page)
- Added "My Affiliate" link (dashboard)

#### 6. **FE/src/jsx/layouts/AdminSidebar/Sidebar.js**
- Added "Referral Management" link
- Permission-based visibility (superadmin or `canManageReferrals`)

#### 7. **FE/src/config/router.js**
- Added user routes: `/user/referral-promo`, `/user/affiliate`
- Added admin route: `/admin/referrals`

---

## 🔐 Permissions

### Admin Permission: `canManageReferrals`
- Located in `userModel.adminPermissions.canManageReferrals`
- Can be granted/revoked by superadmin
- Controls access to:
  - Admin Referral Management page
  - All admin referral API endpoints
  - Ability to activate users
  - Ability to set commissions

### Role-Based Access:
- **Superadmin**: Full access to all referral features
- **Admin**: Access only if `canManageReferrals = true`
- **User**: Can view own referrals and earnings only

---

## 🔄 User Flow

### 1. **Registration with Referral Code**
```
User A (existing) → Shares code "ABCD1234"
↓
User B (new) → Visits /auth/register?ref=ABCD1234
↓
System verifies code → Shows "Referred by User A"
↓
User B completes registration
↓
User B gets referralCode "EFGH5678"
↓
User B.referredBy = User A._id
↓
User B.affiliateStatus = "inactive"
↓
User A.directReferrals.push(User B._id)
```

### 2. **Admin Activation Process**
```
Admin logs in → Goes to /admin/referrals
↓
Sees User B (status: inactive)
↓
Clicks "Activate & Set Commission"
↓
Enters commission amount ($100)
↓
System:
  - User B.affiliateStatus = "active"
  - User A.commissionsPaid.push({
      fromUserId: User B._id,
      amount: 100,
      status: 'paid'
    })
  - User A.totalCommissionEarned += 100
```

### 3. **User Views Earnings**
```
User A logs in → Goes to /user/affiliate
↓
Views Earnings Tab:
  - Total Earned: $100
  - Commission from: User B - $100
  - Status: Paid
```

---

## 📊 Database Schema Changes

### User Model - New Fields:

```javascript
{
  // Unique referral code for this user
  referralCode: String (unique, uppercase, indexed)
  
  // Who referred this user
  referredBy: ObjectId (ref: 'user')
  
  // User's affiliate status
  affiliateStatus: Enum ['inactive', 'active']
  
  // Direct referrals (children)
  directReferrals: [ObjectId] (ref: 'user')
  
  // Total commission earned
  totalCommissionEarned: Number
  
  // Commission records
  commissionsPaid: [{
    fromUserId: ObjectId,
    fromUserName: String,
    fromUserEmail: String,
    amount: Number,
    status: Enum ['pending', 'paid'],
    approvedBy: ObjectId,
    approvedByName: String,
    notes: String,
    createdAt: Date,
    paidAt: Date
  }]
}
```

---

## 🚀 API Endpoints

### Public Endpoints
```
GET /api/v1/referral/verify/:code
  - Verify if referral code is valid
  - Returns referrer info if valid
```

### User Endpoints (Authenticated)
```
GET /api/v1/referral/my-code
  - Get user's own referral code and link

GET /api/v1/referral/my-tree
  - Get referral tree (hierarchical view)

GET /api/v1/referral/my-referrals
  - Get list of direct referrals with stats

GET /api/v1/referral/my-earnings
  - Get commission earnings breakdown
```

### Admin Endpoints (Authenticated + Permission)
```
GET /api/v1/referral/admin/all
  - Get all referrals (paginated, searchable, filterable)

GET /api/v1/referral/admin/statistics
  - Get system-wide referral statistics

GET /api/v1/referral/admin/user/:userId
  - Get specific user's referral details

POST /api/v1/referral/admin/activate/:userId
  - Activate user and set commission for referrer
  - Body: { commissionAmount, notes }

PATCH /api/v1/referral/admin/status/:userId
  - Update user's affiliate status
  - Body: { status: 'active' | 'inactive' }

POST /api/v1/referral/admin/commission/:userId
  - Add manual commission to user
  - Body: { amount, notes, fromUserName }
```

---

## 🎨 UI Pages

### User Pages

#### 1. **Refer & Earn (Promo Page)** - `/user/referral-promo`
- Eye-catching promotional design
- Gradient hero section
- Displays referral code prominently
- Copy/share functionality
- Stats overview
- "How It Works" section
- CTA to affiliate dashboard

#### 2. **My Affiliate Dashboard** - `/user/affiliate`
- **Stats Cards**: Total, Active, Inactive, Total Earned
- **Three Tabs**:
  1. **Referrals List**: Table of all referred users
  2. **Referral Tree**: Hierarchical visual tree
  3. **Earnings**: Commission breakdown and history

### Admin Pages

#### 3. **Referral Management** - `/admin/referrals`
- **Two Tabs**:
  1. **Referrals**: 
     - Searchable/filterable table
     - View user details
     - Activate users
     - Add commissions
  2. **Statistics**:
     - Total referrals
     - Active/inactive counts
     - Commission overview (paid/pending/total)
     - Top referrers leaderboard

---

## 🎯 Key Functionalities

### 1. **Referral Code Generation**
- Automatic on user registration
- 8-character hexadecimal, uppercase
- Uniqueness guaranteed
- Available via `user.generateReferralCode()`

### 2. **Registration with Referral**
- URL parameter support: `?ref=CODE`
- Manual input field (optional)
- Real-time verification
- Visual feedback (✓ Valid)

### 3. **Activation Process**
```
Inactive User → Admin activates → Referrer gets commission
```
- Only inactive users can be activated
- Must have a referrer (`referredBy` not null)
- Admin sets commission amount manually
- Instant update to referrer's earnings

### 4. **Commission Types**
- **Activation Commission**: Paid when referred user is activated
- **Manual Commission**: Admin can add anytime for any reason
- Status: 'paid' or 'pending'

### 5. **Referral Tree**
- Shows 2 levels deep
- Visual hierarchy
- Color-coded status (green=active, yellow=inactive)

---

## 🔧 Setup Instructions

### 1. **Database Migration**
Run the utility script to generate codes for existing users:
```bash
node BE/utils/generateReferralCodesForExistingUsers.js
```

### 2. **Grant Admin Permissions**
To allow an admin to manage referrals, superadmin must set:
```javascript
adminPermissions.canManageReferrals = true
```

This can be done via:
- `/api/v1/admin/:id/permissions` endpoint
- Directly in database
- Admin permission management page

### 3. **Environment Variables**
Ensure these are set in `BE/config/config.env`:
```
DBLINK=your_mongodb_connection_string
FRONTEND_URL=http://localhost:3000
```

### 4. **Frontend Environment**
In `.env` or build config:
```
REACT_APP_API_URL=/api/v1
```

---

## 📝 Usage Examples

### User Sharing Referral Link
```
1. User logs in
2. Goes to "Refer & Earn" page
3. Copies referral link: 
   https://yoursite.com/auth/register?ref=ABCD1234
4. Shares on social media or sends to friends
5. Views affiliate dashboard to track referrals
```

### Admin Activating a Referral
```
1. Admin logs in
2. Goes to "Referral Management"
3. Sees new inactive referral
4. Clicks "Activate" button
5. Enters commission amount: $100
6. Adds note: "First deposit bonus"
7. Clicks "Activate & Pay Commission"
8. System:
   - Sets user to active
   - Adds $100 to referrer's account
   - Creates commission record
```

### Admin Adding Manual Commission
```
1. Admin opens "Referral Management"
2. Finds a referrer
3. Clicks "Add Commission"
4. Enters amount: $50
5. Adds reason: "Special bonus for 5 referrals"
6. Submits
7. Referrer sees new commission in earnings
```

---

## 🎨 Design Theme

The system uses a consistent dark theme across all pages:

**Colors:**
- Primary Purple: `#667eea` → `#764ba2` (gradient)
- Success Green: `#10b981`
- Warning Orange: `#f59e0b`
- Background Dark: `#1A1D29`
- Card Background: `#242833`
- Border: `#2d3142`
- Text Muted: `#8b92a7`
- Text White: `#FFFFFF`

**Components:**
- Material-UI (MUI) components
- Consistent border radius: 12-16px
- Smooth transitions and hover effects
- Responsive grid layout
- Mobile-friendly dialogs and tables

---

## ✅ Testing Checklist

### User Side:
- [ ] New user can register with referral code
- [ ] Invalid referral code shows error
- [ ] User receives unique referral code on registration
- [ ] Referral code visible on promo page
- [ ] Copy/share functionality works
- [ ] Affiliate dashboard shows correct data
- [ ] Referral tree displays properly
- [ ] Earnings tab shows commissions

### Admin Side:
- [ ] Admin with permission can access management page
- [ ] Admin without permission cannot access
- [ ] Search and filters work correctly
- [ ] Activate user dialog functions
- [ ] Commission is added to referrer correctly
- [ ] Statistics tab shows accurate data
- [ ] Top referrers list is sorted correctly

### Backend:
- [ ] Referral codes are unique
- [ ] Registration with code links users correctly
- [ ] API endpoints respect permissions
- [ ] Commission calculations are accurate
- [ ] Database relationships maintain integrity

---

## 🔐 Security Considerations

1. **Permission Checks**: All admin endpoints verify `canManageReferrals`
2. **Code Uniqueness**: Multiple attempts to ensure no duplicates
3. **Input Validation**: Commission amounts must be positive
4. **User Verification**: Can't activate without referrer
5. **Status Guards**: Can't activate already active users

---

## 🚧 Important Notes

### Database:
- Works on **MAIN database only** (not CRM)
- Uses `userModel` from main database
- All mongoose operations use main connection

### Referral Code Format:
- 8 characters
- Hexadecimal (0-9, A-F)
- Uppercase
- Example: `A1B2C3D4`

### Commission Logic:
- **Inactive** = Pending approval by admin
- **Active** = Approved and commission can be paid
- Admin **manually** determines commission amounts
- No automatic commission calculation

### Important Behaviors:
- Users start as 'inactive' regardless of referral
- Only admin can change status to 'active'
- Commission is paid to the **referrer**, not the referee
- Referral tree shows 2 levels deep for performance

---

## 📞 Support & Troubleshooting

### Common Issues:

**Q: User doesn't have a referral code**
A: Run `node BE/utils/generateReferralCodesForExistingUsers.js`

**Q: Admin can't see Referral Management**
A: Check `adminPermissions.canManageReferrals` is `true`

**Q: Referral code not working in registration**
A: Ensure `/api/v1/referral/verify/:code` endpoint is accessible (no auth required)

**Q: Commissions not showing**
A: Check if user is activated and commission was set by admin

**Q: Referral tree not loading**
A: Check browser console for API errors, verify token is valid

---

## 🎉 Success Metrics

Track these KPIs:
- Total users with referral codes
- Total referred users
- Conversion rate (inactive → active)
- Average commission per activation
- Top referrers
- Total commissions paid

---

## 🔄 Future Enhancements (Optional)

Possible improvements:
1. Multi-level commissions (referrer of referrer)
2. Automatic commission rules based on deposit amount
3. Referral rewards/bonuses for milestones
4. Email notifications for new referrals
5. Referral analytics and charts
6. Bulk activation with CSV upload
7. Commission payout history export
8. Custom commission rates per user

---

## 📋 Quick Start Guide

### For Users:
1. Login to your account
2. Click "Refer & Earn" in sidebar
3. Copy your referral code or link
4. Share with friends
5. Track referrals in "My Affiliate" dashboard

### For Admins:
1. Login as admin/superadmin
2. Ensure you have `canManageReferrals` permission
3. Click "Referral Management" in sidebar
4. View all referrals
5. Click "Activate" on inactive users
6. Enter commission amount
7. View statistics tab for system overview

---

## 💡 Marketing Copy

**The promotional text:**
> Turn your friends into crypto buddies and your invites into cash!
> 
> Share your unique code and get $100 for every friend who signs up and starts trading.
> 
> The more you refer, the more you earn — it's that simple.
> 
> Let's make crypto social — invite, earn, repeat!

---

## 📞 Contact

For issues or questions about the MLM system, contact the development team.

**Last Updated**: October 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready

