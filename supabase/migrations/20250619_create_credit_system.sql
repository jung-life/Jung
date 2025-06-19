-- Credit-Based Subscription System Migration
-- This migration creates the infrastructure for a credit-based usage model

-- Drop existing subscription system if needed (uncomment if you want to replace it)
-- DROP TABLE IF EXISTS user_subscriptions CASCADE;

-- Create subscription tiers table
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  monthly_credits INTEGER NOT NULL,
  max_rollover INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  features JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user credits table
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  last_monthly_grant TIMESTAMP WITH TIME ZONE,
  subscription_tier_id TEXT REFERENCES subscription_tiers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT positive_balance CHECK (current_balance >= 0),
  CONSTRAINT valid_totals CHECK (total_earned >= 0 AND total_spent >= 0 AND total_purchased >= 0)
);

-- Create credit transactions table for audit trail
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'purchased', 'granted', 'expired', 'refunded')),
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('subscription', 'purchase', 'usage', 'promotion', 'refund', 'migration', 'monthly_grant')),
  source_id TEXT, -- Reference to purchase ID, message ID, etc.
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_balance_change CHECK (
    (transaction_type IN ('earned', 'purchased', 'granted', 'refunded') AND amount > 0) OR
    (transaction_type IN ('spent', 'expired') AND amount < 0)
  ),
  CONSTRAINT consistent_balance CHECK (balance_before + amount = balance_after)
);

-- Create message costs table for usage tracking
CREATE TABLE IF NOT EXISTS message_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  avatar_id TEXT NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  credits_charged INTEGER NOT NULL DEFAULT 1,
  api_cost_cents INTEGER DEFAULT 0,
  provider TEXT NOT NULL DEFAULT 'claude',
  model_name TEXT DEFAULT 'claude-3-5-sonnet',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT positive_tokens CHECK (input_tokens >= 0 AND output_tokens >= 0),
  CONSTRAINT positive_credits CHECK (credits_charged > 0),
  CONSTRAINT positive_cost CHECK (api_cost_cents >= 0)
);

-- Create credit packages table for one-time purchases
CREATE TABLE IF NOT EXISTS credit_packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  credits INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  bonus_credits INTEGER DEFAULT 0,
  total_credits INTEGER GENERATED ALWAYS AS (credits + bonus_credits) STORED,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT positive_credits CHECK (credits > 0 AND bonus_credits >= 0),
  CONSTRAINT positive_price CHECK (price_cents > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_subscription ON user_credits(subscription_tier_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_costs_user_id ON message_costs(user_id);
CREATE INDEX IF NOT EXISTS idx_message_costs_conversation ON message_costs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_costs_created ON message_costs(created_at DESC);

-- Enable RLS on all tables
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Subscription tiers are publicly readable (for pricing display)
CREATE POLICY "Subscription tiers are publicly readable" ON subscription_tiers
  FOR SELECT USING (true);

-- Credit packages are publicly readable (for pricing display)
CREATE POLICY "Credit packages are publicly readable" ON credit_packages
  FOR SELECT USING (true);

-- Users can only view their own credits
CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only view their own transactions
CREATE POLICY "Users can view own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only view their own message costs
CREATE POLICY "Users can view own message costs" ON message_costs
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all credit-related data
CREATE POLICY "Service role can manage credits" ON user_credits
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage transactions" ON credit_transactions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage message costs" ON message_costs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage tiers" ON subscription_tiers
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage packages" ON credit_packages
  FOR ALL USING (auth.role() = 'service_role');

-- Functions for credit management

-- Function to get user's current credit balance
CREATE OR REPLACE FUNCTION get_user_credit_balance(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  balance INTEGER;
BEGIN
  SELECT current_balance INTO balance
  FROM user_credits
  WHERE user_id = user_uuid;
  
  RETURN COALESCE(balance, 0);
END;
$$;

-- Function to check if user has sufficient credits
CREATE OR REPLACE FUNCTION has_sufficient_credits(user_uuid UUID, required_credits INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  balance INTEGER;
BEGIN
  balance := get_user_credit_balance(user_uuid);
  RETURN balance >= required_credits;
END;
$$;

-- Function to spend credits (with transaction logging)
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
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Check if user has sufficient credits
  IF NOT has_sufficient_credits(user_uuid, credits_to_spend) THEN
    RETURN FALSE;
  END IF;
  
  -- Get current balance
  SELECT current_balance INTO current_balance
  FROM user_credits
  WHERE user_id = user_uuid;
  
  new_balance := current_balance - credits_to_spend;
  
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
    current_balance,
    new_balance,
    source_type_param,
    source_id_param,
    COALESCE(description_param, 'Credits spent for ' || source_type_param)
  );
  
  RETURN TRUE;
END;
$$;

-- Function to add credits (purchases, grants, etc.)
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
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Ensure user credits record exists
  INSERT INTO user_credits (user_id, current_balance)
  VALUES (user_uuid, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Get current balance
  SELECT current_balance INTO current_balance
  FROM user_credits
  WHERE user_id = user_uuid;
  
  new_balance := current_balance + credits_to_add;
  
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
    current_balance,
    new_balance,
    source_type_param,
    source_id_param,
    COALESCE(description_param, 'Credits added via ' || source_type_param)
  );
  
  RETURN TRUE;
END;
$$;

-- Function to grant monthly credits based on subscription
CREATE OR REPLACE FUNCTION grant_monthly_credits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  credits_granted INTEGER := 0;
  total_users_updated INTEGER := 0;
BEGIN
  FOR user_record IN
    SELECT 
      uc.user_id,
      uc.subscription_tier_id,
      st.monthly_credits,
      st.max_rollover,
      uc.current_balance,
      uc.last_monthly_grant
    FROM user_credits uc
    JOIN subscription_tiers st ON uc.subscription_tier_id = st.id
    WHERE 
      st.monthly_credits > 0
      AND (
        uc.last_monthly_grant IS NULL 
        OR uc.last_monthly_grant < date_trunc('month', NOW())
      )
  LOOP
    -- Calculate credits to grant (don't exceed rollover limit)
    credits_granted := user_record.monthly_credits;
    
    -- If adding monthly credits would exceed rollover limit, cap it
    IF user_record.current_balance + credits_granted > user_record.max_rollover THEN
      credits_granted := GREATEST(0, user_record.max_rollover - user_record.current_balance);
    END IF;
    
    -- Grant credits if any should be granted
    IF credits_granted > 0 THEN
      PERFORM add_credits(
        user_record.user_id,
        credits_granted,
        'granted',
        'monthly_grant',
        user_record.subscription_tier_id,
        'Monthly subscription credits'
      );
    END IF;
    
    -- Update last grant timestamp
    UPDATE user_credits
    SET last_monthly_grant = NOW()
    WHERE user_id = user_record.user_id;
    
    total_users_updated := total_users_updated + 1;
  END LOOP;
  
  RETURN total_users_updated;
END;
$$;

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON user_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_tiers_updated_at
  BEFORE UPDATE ON subscription_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default subscription tiers
INSERT INTO subscription_tiers (id, name, description, monthly_credits, max_rollover, price_cents, features, sort_order) VALUES
('free', 'Free', 'Perfect for trying out the app', 10, 20, 0, '{"avatars": ["jung"], "features": ["basic_chat"]}', 1),
('basic', 'Basic', 'Great for regular users', 150, 300, 999, '{"avatars": "*", "features": ["basic_chat", "insights", "priority_support"]}', 2),
('premium', 'Premium', 'Best for power users', 400, 800, 1999, '{"avatars": "*", "features": ["basic_chat", "insights", "analytics", "export", "priority_support"]}', 3),
('pro', 'Professional', 'For heavy users and professionals', 1000, 2000, 3999, '{"avatars": "*", "features": ["basic_chat", "insights", "analytics", "export", "api_access", "custom_training", "priority_support"]}', 4)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  monthly_credits = EXCLUDED.monthly_credits,
  max_rollover = EXCLUDED.max_rollover,
  price_cents = EXCLUDED.price_cents,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order;

-- Insert default credit packages
INSERT INTO credit_packages (id, name, description, credits, price_cents, bonus_credits, sort_order) VALUES
('starter', 'Starter Pack', 'Perfect for light usage', 50, 499, 0, 1),
('basic', 'Basic Pack', 'Great value for regular users', 100, 899, 10, 2),
('popular', 'Popular Pack', 'Most popular choice', 250, 1999, 50, 3),
('professional', 'Professional Pack', 'For power users', 500, 3499, 150, 4),
('unlimited', 'Unlimited Pack', 'Maximum value', 1000, 5999, 400, 5)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  credits = EXCLUDED.credits,
  price_cents = EXCLUDED.price_cents,
  bonus_credits = EXCLUDED.bonus_credits,
  sort_order = EXCLUDED.sort_order;

-- Grant necessary permissions
GRANT SELECT ON subscription_tiers TO anon, authenticated;
GRANT SELECT ON credit_packages TO anon, authenticated;
GRANT SELECT ON user_credits TO authenticated;
GRANT SELECT ON credit_transactions TO authenticated;
GRANT SELECT ON message_costs TO authenticated;

GRANT ALL ON subscription_tiers TO service_role;
GRANT ALL ON credit_packages TO service_role;
GRANT ALL ON user_credits TO service_role;
GRANT ALL ON credit_transactions TO service_role;
GRANT ALL ON message_costs TO service_role;

GRANT EXECUTE ON FUNCTION get_user_credit_balance(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION has_sufficient_credits(UUID, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION spend_credits(UUID, INTEGER, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION add_credits(UUID, INTEGER, TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION grant_monthly_credits() TO service_role;

-- Create a function to migrate existing users to credit system
CREATE OR REPLACE FUNCTION migrate_users_to_credit_system()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  subscription_record RECORD;
  credits_to_grant INTEGER;
  tier_id TEXT;
  users_migrated INTEGER := 0;
BEGIN
  -- Migrate users based on their current subscription status
  FOR user_record IN
    SELECT DISTINCT user_id
    FROM auth.users
    WHERE id NOT IN (SELECT user_id FROM user_credits)
  LOOP
    -- Check if user has an active subscription
    SELECT * INTO subscription_record
    FROM user_subscriptions
    WHERE user_id = user_record.user_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF subscription_record.product_id IS NOT NULL THEN
      -- Determine tier and credits based on product_id
      CASE
        WHEN subscription_record.product_id LIKE '%yearly%' THEN
          tier_id := 'premium';
          credits_to_grant := 400; -- Premium tier monthly credits
        WHEN subscription_record.product_id LIKE '%monthly%' THEN
          tier_id := 'basic';
          credits_to_grant := 150; -- Basic tier monthly credits
        ELSE
          tier_id := 'basic';
          credits_to_grant := 150;
      END CASE;
    ELSE
      -- Free user
      tier_id := 'free';
      credits_to_grant := 10;
    END IF;
    
    -- Create user credits record
    INSERT INTO user_credits (user_id, current_balance, subscription_tier_id)
    VALUES (user_record.user_id, credits_to_grant, tier_id);
    
    -- Log the migration transaction
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
      user_record.user_id,
      'granted',
      credits_to_grant,
      0,
      credits_to_grant,
      'migration',
      tier_id,
      'Initial credits granted during migration to credit system'
    );
    
    users_migrated := users_migrated + 1;
  END LOOP;
  
  RETURN users_migrated;
END;
$$;

-- Grant permission for migration function
GRANT EXECUTE ON FUNCTION migrate_users_to_credit_system() TO service_role;

-- Comments for documentation
COMMENT ON TABLE subscription_tiers IS 'Defines available subscription tiers with credit allowances';
COMMENT ON TABLE user_credits IS 'Tracks each user''s credit balance and subscription tier';
COMMENT ON TABLE credit_transactions IS 'Audit log of all credit transactions';
COMMENT ON TABLE message_costs IS 'Tracks the cost and tokens used for each message';
COMMENT ON TABLE credit_packages IS 'Defines one-time credit purchase packages';

COMMENT ON FUNCTION get_user_credit_balance(UUID) IS 'Returns the current credit balance for a user';
COMMENT ON FUNCTION has_sufficient_credits(UUID, INTEGER) IS 'Checks if user has enough credits for an operation';
COMMENT ON FUNCTION spend_credits(UUID, INTEGER, TEXT, TEXT, TEXT) IS 'Deducts credits from user account with transaction logging';
COMMENT ON FUNCTION add_credits(UUID, INTEGER, TEXT, TEXT, TEXT, TEXT) IS 'Adds credits to user account with transaction logging';
COMMENT ON FUNCTION grant_monthly_credits() IS 'Grants monthly credits to all subscription users (run via cron)';
COMMENT ON FUNCTION migrate_users_to_credit_system() IS 'One-time migration function to move existing users to credit system';
