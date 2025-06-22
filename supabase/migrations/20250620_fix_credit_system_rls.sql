-- Fix Credit System RLS Policies
-- This migration disables problematic RLS policies and creates working ones

-- Step 1: Temporarily disable RLS to fix the issue
ALTER TABLE user_credits DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE message_costs DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "user_credits_select" ON user_credits;
DROP POLICY IF EXISTS "user_credits_insert" ON user_credits;
DROP POLICY IF EXISTS "user_credits_update" ON user_credits;
DROP POLICY IF EXISTS "user_credits_delete" ON user_credits;
DROP POLICY IF EXISTS "credit_transactions_select" ON credit_transactions;
DROP POLICY IF EXISTS "credit_transactions_insert" ON credit_transactions;
DROP POLICY IF EXISTS "credit_transactions_update" ON credit_transactions;
DROP POLICY IF EXISTS "credit_transactions_delete" ON credit_transactions;
DROP POLICY IF EXISTS "message_costs_select" ON message_costs;
DROP POLICY IF EXISTS "message_costs_insert" ON message_costs;
DROP POLICY IF EXISTS "message_costs_update" ON message_costs;
DROP POLICY IF EXISTS "message_costs_delete" ON message_costs;

-- Step 3: Re-enable RLS with proper policies
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_costs ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, working policies
CREATE POLICY "user_credits_policy" ON user_credits
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "credit_transactions_policy" ON credit_transactions
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "message_costs_policy" ON message_costs
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Step 5: Initialize any users without credit records
-- This function will be called to initialize credits for existing users
CREATE OR REPLACE FUNCTION initialize_missing_user_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Loop through users who don't have credit records
    FOR user_record IN 
        SELECT au.id, au.email
        FROM auth.users au
        LEFT JOIN user_credits uc ON au.id = uc.user_id
        WHERE uc.user_id IS NULL
    LOOP
        -- Insert credit record for user
        INSERT INTO user_credits (
            user_id, 
            current_balance, 
            total_earned, 
            total_spent, 
            total_purchased, 
            subscription_tier_id,
            created_at,
            updated_at
        ) VALUES (
            user_record.id,
            10,
            10,
            0,
            0,
            'free',
            NOW(),
            NOW()
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
            description,
            metadata,
            created_at
        ) VALUES (
            user_record.id,
            'granted',
            10,
            0,
            10,
            'migration',
            'free',
            'Welcome credits for existing user',
            '{}',
            NOW()
        ) ON CONFLICT DO NOTHING;

        RAISE NOTICE 'Initialized credits for user: %', user_record.email;
    END LOOP;
END;
$$;

-- Step 6: Run the initialization function
SELECT initialize_missing_user_credits();

-- Step 7: Drop the temporary function
DROP FUNCTION initialize_missing_user_credits();
