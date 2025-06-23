# Manual Credit Spending Fix - Supabase Dashboard Method

## 🎯 Quick Fix (No Scripts Needed)

Since the Node.js script requires the service role key, here's how to apply the fix directly:

### Step 1: Open Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your Jung app project
4. Go to **SQL Editor** in the left sidebar

### Step 2: Copy and Paste This SQL

Copy and paste the following SQL into the Supabase SQL Editor and click **Run**:

```sql
-- Fix the spend_credits function to resolve ambiguous column reference
CREATE OR REPLACE FUNCTION spend_credits(
  user_uuid UUID,
  credits_to_spend INTEGER,
  source_type_param TEXT DEFAULT 'usage',
  source_id_param TEXT DEFAULT NULL,
  description_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Check if user has sufficient credits
  IF NOT has_sufficient_credits(user_uuid, credits_to_spend) THEN
    RETURN FALSE;
  END IF;
  
  -- Get current balance with explicit table alias to avoid ambiguity
  SELECT uc.current_balance INTO user_balance
  FROM user_credits uc
  WHERE uc.user_id = user_uuid;
  
  -- If no record found, return false
  IF user_balance IS NULL THEN
    RETURN FALSE;
  END IF;
  
  new_balance := user_balance - credits_to_spend;
  
  -- Update user credits
  UPDATE user_credits
  SET 
    current_balance = new_balance,
    total_spent = total_spent + credits_to_spend,
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  -- Log transaction
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
    user_uuid,
    'spent',
    -credits_to_spend,
    user_balance,
    new_balance,
    source_type_param,
    source_id_param,
    COALESCE(description_param, 'Credits spent for ' || source_type_param)
  );
  
  RETURN TRUE;
END;
$$;

-- Also fix the add_credits function for consistency
CREATE OR REPLACE FUNCTION add_credits(
  user_uuid UUID,
  credits_to_add INTEGER,
  transaction_type_param TEXT DEFAULT 'granted',
  source_type_param TEXT DEFAULT 'promotion',
  source_id_param TEXT DEFAULT NULL,
  description_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Ensure user credits record exists
  INSERT INTO user_credits (user_id, current_balance)
  VALUES (user_uuid, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Get current balance with explicit table alias
  SELECT uc.current_balance INTO user_balance
  FROM user_credits uc
  WHERE uc.user_id = user_uuid;
  
  new_balance := user_balance + credits_to_add;
  
  -- Update user credits
  UPDATE user_credits
  SET 
    current_balance = new_balance,
    total_earned = total_earned + credits_to_add,
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  -- Log transaction
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
    user_uuid,
    transaction_type_param,
    credits_to_add,
    user_balance,
    new_balance,
    source_type_param,
    source_id_param,
    COALESCE(description_param, 'Credits added via ' || source_type_param)
  );
  
  RETURN TRUE;
END;
$$;
```

### Step 3: Verify the Fix

1. ✅ **SQL should execute successfully** (green checkmark in Supabase)
2. ✅ **Test sending a message** in your app
3. ✅ **Check console** - should no longer show "ambiguous column reference" error
4. ✅ **Verify credit deduction** - balance should decrease by 1

## 🧪 Test the Fix

After running the SQL:

1. **Open your Jung app**
2. **Send a message to any therapist**
3. **Check your credit balance** (should decrease)
4. **Monitor console logs** - should show successful credit spending

## ✅ Expected Results

- ❌ **Before fix**: `Error spending credits: column reference "current_balance" is ambiguous`
- ✅ **After fix**: Credits deduct properly, no error messages

## 🎯 What This Fix Does

- **Fixes variable naming conflict** in PostgreSQL functions
- **Uses explicit table aliases** (`uc.current_balance` instead of `current_balance`)
- **Maintains all existing functionality** while fixing the ambiguity error
- **Ensures proper credit deduction** for each message sent

The credit system should now work perfectly! 🌟
