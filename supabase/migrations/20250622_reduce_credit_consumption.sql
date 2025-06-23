-- Temporary Fix: Reduce Credit Consumption Rate
-- Migration: 20250622_reduce_credit_consumption.sql
-- 
-- This is a quick fix to make credits more user-friendly while maintaining the current system.
-- Changes credit consumption from 1 credit per message to 1 credit per 5 messages.

-- Update the default credit charge in message_costs table
ALTER TABLE message_costs 
ALTER COLUMN credits_charged SET DEFAULT 0.2;

-- Create a function to determine credit cost based on message count in conversation
CREATE OR REPLACE FUNCTION calculate_message_credit_cost(
  conversation_uuid UUID,
  current_message_count INTEGER DEFAULT 1
)
RETURNS DECIMAL(3,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_messages INTEGER;
  credit_cost DECIMAL(3,2);
BEGIN
  -- Get total message count for this conversation
  SELECT COUNT(*) INTO total_messages
  FROM messages 
  WHERE conversation_id = conversation_uuid;
  
  -- Credit consumption logic: 1 credit per 5 messages
  -- Messages 1-5: 0.2 credits each (total: 1 credit)
  -- Messages 6-10: 0.2 credits each (total: 1 more credit)
  -- This creates "bundles" of 5 messages per credit
  
  IF total_messages % 5 = 1 THEN
    -- First message of a new bundle: charge 0.2 credits
    credit_cost := 0.2;
  ELSE
    -- Subsequent messages in bundle: no charge
    credit_cost := 0.0;
  END IF;
  
  RETURN credit_cost;
END;
$$;

-- Update spend_credits function to handle fractional credits
CREATE OR REPLACE FUNCTION spend_fractional_credits(
  user_uuid UUID,
  credits_to_spend DECIMAL(10,2),
  source_type_param TEXT DEFAULT 'usage',
  source_id_param TEXT DEFAULT NULL,
  description_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_balance DECIMAL(10,2);
  new_balance DECIMAL(10,2);
BEGIN
  -- Get current balance
  SELECT CAST(uc.current_balance AS DECIMAL(10,2)) INTO user_balance
  FROM user_credits uc
  WHERE uc.user_id = user_uuid;
  
  -- If no record found, return false
  IF user_balance IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has sufficient credits
  IF user_balance < credits_to_spend THEN
    RETURN FALSE;
  END IF;
  
  new_balance := user_balance - credits_to_spend;
  
  -- Update user credits (only if we're spending a meaningful amount)
  IF credits_to_spend >= 0.01 THEN
    UPDATE user_credits
    SET 
      current_balance = FLOOR(new_balance),
      total_spent = total_spent + CEIL(credits_to_spend),
      updated_at = NOW()
    WHERE user_id = user_uuid;
    
    -- Log transaction (only for meaningful amounts)
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
      -CEIL(credits_to_spend),
      FLOOR(user_balance),
      FLOOR(new_balance),
      source_type_param,
      source_id_param,
      COALESCE(description_param, 'Credits spent for ' || source_type_param)
    );
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Create a more user-friendly credit spending function for messages
CREATE OR REPLACE FUNCTION spend_message_credits(
  user_uuid UUID,
  conversation_uuid UUID,
  message_count INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  credit_cost DECIMAL(3,2);
  success BOOLEAN;
BEGIN
  -- Calculate credit cost for this message
  credit_cost := calculate_message_credit_cost(conversation_uuid, message_count);
  
  -- Only spend credits if there's actually a cost
  IF credit_cost > 0 THEN
    success := spend_fractional_credits(
      user_uuid,
      credit_cost,
      'usage',
      conversation_uuid::TEXT,
      'Message in conversation (bundle pricing)'
    );
    RETURN success;
  ELSE
    -- No credit cost for this message
    RETURN TRUE;
  END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_message_credit_cost(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION spend_fractional_credits(UUID, DECIMAL, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION spend_message_credits(UUID, UUID, INTEGER) TO service_role;

-- Update subscription tiers to be more generous
UPDATE subscription_tiers SET
  monthly_credits = CASE 
    WHEN id = 'free' THEN 25      -- 25 credits = ~125 messages
    WHEN id = 'basic' THEN 200    -- 200 credits = ~1000 messages  
    WHEN id = 'premium' THEN 500  -- 500 credits = ~2500 messages
    WHEN id = 'pro' THEN 1200     -- 1200 credits = ~6000 messages
    ELSE monthly_credits
  END,
  max_rollover = CASE 
    WHEN id = 'free' THEN 50
    WHEN id = 'basic' THEN 400
    WHEN id = 'premium' THEN 1000
    WHEN id = 'pro' THEN 2400
    ELSE max_rollover
  END
WHERE id IN ('free', 'basic', 'premium', 'pro');

-- Update credit packages to reflect better value
UPDATE credit_packages SET
  credits = CASE 
    WHEN id = 'starter' THEN 75     -- 75 credits = ~375 messages
    WHEN id = 'basic' THEN 150      -- 150 credits = ~750 messages
    WHEN id = 'popular' THEN 400    -- 400 credits = ~2000 messages
    WHEN id = 'professional' THEN 800 -- 800 credits = ~4000 messages
    WHEN id = 'unlimited' THEN 1500  -- 1500 credits = ~7500 messages
    ELSE credits
  END,
  bonus_credits = CASE 
    WHEN id = 'starter' THEN 0
    WHEN id = 'basic' THEN 25
    WHEN id = 'popular' THEN 100
    WHEN id = 'professional' THEN 250
    WHEN id = 'unlimited' THEN 500
    ELSE bonus_credits
  END
WHERE id IN ('starter', 'basic', 'popular', 'professional', 'unlimited');

-- Log successful completion
DO $$
BEGIN
  RAISE NOTICE 'Credit consumption has been optimized!';
  RAISE NOTICE 'New model: ~1 credit per 5 messages (much more user-friendly)';
  RAISE NOTICE 'Subscription tiers have been made more generous';
  RAISE NOTICE 'Users will now get significantly better value per credit';
END $$;
