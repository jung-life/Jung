-- Create user_subscriptions table for tracking in-app purchases
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  purchase_token TEXT,
  transaction_id TEXT,
  original_transaction_id TEXT,
  receipt_data TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  is_trial BOOLEAN DEFAULT false,
  is_in_grace_period BOOLEAN DEFAULT false,
  auto_renew_status BOOLEAN DEFAULT true,
  cancellation_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active ON user_subscriptions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_product ON user_subscriptions(product_id);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own subscriptions (via service role)
CREATE POLICY "Service role can manage subscriptions" ON user_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Function to get active subscription for a user
CREATE OR REPLACE FUNCTION get_active_subscription(user_uuid UUID)
RETURNS TABLE (
  subscription_id UUID,
  product_id TEXT,
  platform TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_trial BOOLEAN,
  is_in_grace_period BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.id,
    us.product_id,
    us.platform,
    us.expires_at,
    us.is_trial,
    us.is_in_grace_period
  FROM user_subscriptions us
  WHERE us.user_id = user_uuid 
    AND us.is_active = true
    AND (us.expires_at IS NULL OR us.expires_at > NOW())
  ORDER BY us.created_at DESC
  LIMIT 1;
END;
$$;

-- Function to check if user has premium access
CREATE OR REPLACE FUNCTION has_premium_access(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  active_sub RECORD;
BEGIN
  SELECT * INTO active_sub 
  FROM get_active_subscription(user_uuid) 
  LIMIT 1;
  
  RETURN active_sub IS NOT NULL;
END;
$$;

-- Function to update subscription status
CREATE OR REPLACE FUNCTION update_subscription_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_status();

-- Grant necessary permissions
GRANT SELECT ON user_subscriptions TO anon, authenticated;
GRANT ALL ON user_subscriptions TO service_role;
GRANT EXECUTE ON FUNCTION get_active_subscription(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION has_premium_access(UUID) TO anon, authenticated;
