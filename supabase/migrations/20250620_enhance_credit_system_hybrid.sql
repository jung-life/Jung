-- Enhanced Credit System with Hybrid Subscription Model
-- This migration extends the existing credit system to support both
-- one-time credit packages and subscription tiers with monthly allocations

-- Create enhanced subscription tiers table
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  monthly_credits INTEGER NOT NULL,
  price_monthly INTEGER NOT NULL, -- price in cents
  features JSONB NOT NULL DEFAULT '[]',
  credit_discount INTEGER NOT NULL DEFAULT 0, -- percentage discount on additional credits
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enhanced credit packages table
CREATE TABLE IF NOT EXISTS credit_packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  bonus_credits INTEGER NOT NULL DEFAULT 0,
  price INTEGER NOT NULL, -- price in cents
  description TEXT,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id TEXT NOT NULL REFERENCES subscription_tiers(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due')) DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  next_billing_date TIMESTAMP WITH TIME ZONE NOT NULL,
  credits_allocated INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subscription_tiers (read-only for authenticated users)
CREATE POLICY "subscription_tiers_select" ON subscription_tiers
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Create RLS policies for credit_packages (read-only for authenticated users)
CREATE POLICY "credit_packages_select" ON credit_packages
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Create RLS policies for user_subscriptions
CREATE POLICY "user_subscriptions_select" ON user_subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_subscriptions_insert" ON user_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_subscriptions_update" ON user_subscriptions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Insert default subscription tiers
INSERT INTO subscription_tiers (id, name, monthly_credits, price_monthly, features, credit_discount) VALUES
('free', 'Free', 10, 0, '["Access to Carl Jung avatar", "Basic mood tracking", "Limited history"]', 0),
('basic', 'Basic', 150, 999, '["All avatars available", "Complete feature access", "25% discount on additional credits"]', 25),
('premium', 'Premium', 400, 1999, '["Advanced analytics", "Export capabilities", "30% discount on additional credits"]', 30),
('professional', 'Professional', 1000, 3999, '["API access potential", "Custom training options", "35% discount on additional credits"]', 35)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  monthly_credits = EXCLUDED.monthly_credits,
  price_monthly = EXCLUDED.price_monthly,
  features = EXCLUDED.features,
  credit_discount = EXCLUDED.credit_discount;

-- Insert default credit packages
INSERT INTO credit_packages (id, name, credits, bonus_credits, price, description, is_popular) VALUES
('starter', 'Starter Pack', 50, 0, 499, 'Perfect for trying the app', false),
('popular', 'Popular Pack', 250, 50, 1999, 'Best value proposition', true),
('professional', 'Professional Pack', 500, 150, 3499, 'Heavy user option', false),
('unlimited', 'Unlimited Pack', 1000, 400, 5999, 'Maximum value', false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  credits = EXCLUDED.credits,
  bonus_credits = EXCLUDED.bonus_credits,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  is_popular = EXCLUDED.is_popular;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_active ON subscription_tiers(is_active);
CREATE INDEX IF NOT EXISTS idx_credit_packages_active ON credit_packages(is_active);