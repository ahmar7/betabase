# Create Test Referral Tree

This guide will help you create a test referral tree structure for testing the MLM/Referral system.

## Prerequisites

1. Make sure your backend server is running or at least you have access to the database
2. Your user account exists with email: `ahmarjabbar7@gmail.com`

## How to Run

### Step 1: Navigate to Backend Directory
```bash
cd BE
```

### Step 2: Run the Script
```bash
node utils/createTestReferralTree.js
```

## What This Script Does

The script will create a multi-level referral tree:

```
👤 You (Ahmar Jabbar)
├── 👤 John Smith (Active) - $100 commission
│   ├── 👤 Emma Wilson (Active) - $100 commission
│   │   └── 👤 Lisa Martinez (Active)
│   └── 👤 David Brown (Pending)
├── 👤 Sarah Johnson (Active)
└── 👤 Mike Davis (Pending)
```

### Test Users Created:

| Name | Email | Status | Level |
|------|-------|--------|-------|
| John Smith | john.smith@test.com | Active | Level 1 (Your direct) |
| Sarah Johnson | sarah.johnson@test.com | Active | Level 1 (Your direct) |
| Mike Davis | mike.davis@test.com | Pending | Level 1 (Your direct) |
| Emma Wilson | emma.wilson@test.com | Active | Level 2 (John's referral) |
| David Brown | david.brown@test.com | Pending | Level 2 (John's referral) |
| Lisa Martinez | lisa.martinez@test.com | Active | Level 3 (Emma's referral) |

**All test users have password:** `12345678`

## After Running the Script

1. Login to your account: `ahmarjabbar7@gmail.com` / `12345678`
2. Navigate to **Affiliate Dashboard**: `/user/affiliate` or `/dashboard/affiliate`
3. You should see:
   - Your referral code
   - 3 direct referrals
   - 2 active, 1 pending
   - $200 total earned (from John and Sarah)
   - Full referral tree visualization

## Testing Features

### As User:
1. **View Referral Tree** - See the visual tree structure
2. **View Referral List** - See all your referrals in a table
3. **View Earnings** - See commission breakdown
4. **Share Referral Code** - Copy and share your code

### As Admin:
1. Navigate to **Referral Management**: `/admin/referrals`
2. **Activate Pending Users** - Activate Mike Davis and David Brown
3. **Set Commissions** - Add manual commissions
4. **View Statistics** - See system-wide referral stats
5. **View Top Referrers** - See leaderboard

## Troubleshooting

### Script fails with "Main user not found"
- Make sure you're logged in at least once with `ahmarjabbar7@gmail.com`
- Check that the email is correct in the script

### Database connection error
- Ensure your `.env` file has the correct `MONGO_URL`
- Make sure MongoDB is running

### Users already exist
- The script will update existing users instead of creating new ones
- You can safely run the script multiple times

## Clean Up Test Data (Optional)

To remove test users:
```javascript
// Run this in MongoDB shell or create a cleanup script
db.users.deleteMany({
  email: {
    $in: [
      'john.smith@test.com',
      'sarah.johnson@test.com',
      'mike.davis@test.com',
      'emma.wilson@test.com',
      'david.brown@test.com',
      'lisa.martinez@test.com'
    ]
  }
});
```

## Next Steps

After testing, you can:
1. Register new users with your referral code
2. Test the activation flow as an admin
3. Test commission payments
4. View the referral tree growth in real-time

