# Credit System RLS Policy Fix

The RLS (Row Level Security) policies need to be properly configured for the credit system to work. 

## Quick Fix - Run this SQL in your Supabase SQL Editor:

```sql
-- Fix RLS policies for credit system
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_costs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "user_credits_select" ON user_credits;
DROP POLICY IF EXISTS "user_credits_insert" ON user_credits;
DROP POLICY IF EXISTS "user_credits_update" ON user_credits;
DROP POLICY IF EXISTS "credit_transactions_select" ON credit_transactions;
DROP POLICY IF EXISTS "credit_transactions_insert" ON credit_transactions;
DROP POLICY IF EXISTS "message_costs_select" ON message_costs;
DROP POLICY IF EXISTS "message_costs_insert" ON message_costs;

-- Create working policies for user_credits
CREATE POLICY "user_credits_select" ON user_credits
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "user_credits_insert" ON user_credits
FOR INSERT TO authenticated  
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_credits_update" ON user_credits
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create working policies for credit_transactions
CREATE POLICY "credit_transactions_select" ON credit_transactions
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "credit_transactions_insert" ON credit_transactions
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Create working policies for message_costs
CREATE POLICY "message_costs_select" ON message_costs
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "message_costs_insert" ON message_costs
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
```

## Steps to Fix:

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste the SQL above**
4. **Click "Run"**
5. **Try your app again**

## After Running the SQL:

Try accessing the premium features again. The credit system should now:
- Automatically create credit records for new users
- Allow proper credit balance fetching
- Enable credit transactions
- Work with the hybrid subscription screen

## Alternative: Initialize Credits Manually

If you still have issues, run this to manually initialize credits for your user:

```sql
-- Replace 'YOUR_USER_ID' with your actual user ID from auth.users
INSERT INTO user_credits (
  user_id, 
  current_balance, 
  total_earned, 
  total_spent, 
  total_purchased, 
  subscription_tier_id
) VALUES (
  'YOUR_USER_ID',
  10,
  10,
  0,
  0,
  'free'
) ON CONFLICT (user_id) DO NOTHING;

-- Add initial transaction record
INSERT INTO credit_transactions (
  user_id,
  transaction_type,
  amount,
  balance_before,
  balance_after,
  source_type,
  source_id,
  description
) VALUES (
  'YOUR_USER_ID',
  'granted',
  10,
  0,
  10,
  'migration',
  'free',
  'Welcome credits for new user'
) ON CONFLICT DO NOTHING;
```

## How to Find Your User ID:

Run this query in SQL Editor to find your user ID:
```sql
SELECT id, email FROM auth.users;
```

## Test the Fix:

After running the SQL, your hybrid subscription screen should:
- ✅ Display credit balance without errors
- ✅ Show pricing tiers and packages from database
- ✅ Allow credit initialization for new users
- ✅ Enable upgrade recommendations based on usage
