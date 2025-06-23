-- Session-Based Credit Model Implementation
-- Migration: 20250622_implement_session_based_credits.sql
-- 
-- This implements the optimal credit model:
-- 1 credit = 1 complete conversation session (30-60 minutes OR 20-30 messages)

-- Create conversation sessions table
CREATE TABLE IF NOT EXISTS conversation_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  avatar_id TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  message_count INTEGER DEFAULT 0,
  session_duration_minutes INTEGER DEFAULT 0,
  credit_charged BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  session_type TEXT DEFAULT 'conversation',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_message_count CHECK (message_count >= 0),
  CONSTRAINT valid_duration CHECK (session_duration_minutes >= 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_user_id ON conversation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_conversation_id ON conversation_sessions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_active ON conversation_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_start_time ON conversation_sessions(start_time DESC);

-- Enable RLS
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own sessions" ON conversation_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON conversation_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON conversation_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all sessions" ON conversation_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Function to start a new conversation session
CREATE OR REPLACE FUNCTION start_conversation_session(
  user_uuid UUID,
  conversation_uuid UUID,
  avatar_id_param TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_id UUID;
  existing_session_id UUID;
BEGIN
  -- Check if there's already an active session for this conversation
  SELECT id INTO existing_session_id
  FROM conversation_sessions
  WHERE user_id = user_uuid 
    AND conversation_id = conversation_uuid 
    AND is_active = true
  LIMIT 1;
  
  IF existing_session_id IS NOT NULL THEN
    -- Return existing active session
    RETURN existing_session_id;
  END IF;
  
  -- Create new session
  INSERT INTO conversation_sessions (
    user_id,
    conversation_id,
    avatar_id,
    start_time,
    last_activity,
    is_active
  ) VALUES (
    user_uuid,
    conversation_uuid,
    avatar_id_param,
    NOW(),
    NOW(),
    true
  ) RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$;

-- Function to update session activity
CREATE OR REPLACE FUNCTION update_session_activity(
  session_uuid UUID,
  message_count_increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_start TIMESTAMP WITH TIME ZONE;
  current_messages INTEGER;
  duration_minutes INTEGER;
BEGIN
  -- Update session with new activity
  UPDATE conversation_sessions
  SET 
    last_activity = NOW(),
    message_count = message_count + message_count_increment,
    updated_at = NOW()
  WHERE id = session_uuid AND is_active = true
  RETURNING start_time, message_count INTO session_start, current_messages;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate session duration
  duration_minutes := EXTRACT(EPOCH FROM (NOW() - session_start)) / 60;
  
  -- Update duration
  UPDATE conversation_sessions
  SET session_duration_minutes = duration_minutes
  WHERE id = session_uuid;
  
  RETURN TRUE;
END;
$$;

-- Function to end a conversation session and charge credits
CREATE OR REPLACE FUNCTION end_conversation_session(
  session_uuid UUID,
  force_end BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record RECORD;
  should_charge BOOLEAN := FALSE;
  credit_success BOOLEAN;
BEGIN
  -- Get session details
  SELECT * INTO session_record
  FROM conversation_sessions
  WHERE id = session_uuid AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Determine if we should charge a credit
  -- Charge if: 30+ minutes OR 20+ messages OR force_end
  should_charge := (
    session_record.session_duration_minutes >= 30 OR
    session_record.message_count >= 20 OR
    force_end
  ) AND NOT session_record.credit_charged;
  
  -- End the session
  UPDATE conversation_sessions
  SET 
    is_active = false,
    end_time = NOW(),
    updated_at = NOW()
  WHERE id = session_uuid;
  
  -- Charge credit if needed
  IF should_charge THEN
    credit_success := spend_credits(
      session_record.user_id,
      1,
      'usage',
      session_uuid::TEXT,
      'Conversation session completed'
    );
    
    -- Mark as charged regardless of success (prevent double charging)
    UPDATE conversation_sessions
    SET credit_charged = true
    WHERE id = session_uuid;
    
    RETURN credit_success;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Function to auto-end inactive sessions
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record RECORD;
  sessions_ended INTEGER := 0;
BEGIN
  -- Find sessions inactive for 30+ minutes
  FOR session_record IN
    SELECT id, user_id, last_activity, session_duration_minutes, message_count
    FROM conversation_sessions
    WHERE is_active = true
      AND last_activity < NOW() - INTERVAL '30 minutes'
  LOOP
    -- End the session (this will handle credit charging)
    PERFORM end_conversation_session(session_record.id, false);
    sessions_ended := sessions_ended + 1;
  END LOOP;
  
  RETURN sessions_ended;
END;
$$;

-- Function to get or create active session for a conversation
CREATE OR REPLACE FUNCTION get_or_create_session(
  user_uuid UUID,
  conversation_uuid UUID,
  avatar_id_param TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_id UUID;
BEGIN
  -- First try to get existing active session
  SELECT id INTO session_id
  FROM conversation_sessions
  WHERE user_id = user_uuid 
    AND conversation_id = conversation_uuid 
    AND is_active = true
    AND last_activity > NOW() - INTERVAL '30 minutes'
  LIMIT 1;
  
  IF session_id IS NOT NULL THEN
    -- Update activity for existing session
    PERFORM update_session_activity(session_id, 0);
    RETURN session_id;
  END IF;
  
  -- No active session found, create new one
  session_id := start_conversation_session(user_uuid, conversation_uuid, avatar_id_param);
  RETURN session_id;
END;
$$;

-- Enhanced function to handle message credits with session tracking
CREATE OR REPLACE FUNCTION process_message_with_session(
  user_uuid UUID,
  conversation_uuid UUID,
  avatar_id_param TEXT,
  message_content TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_id UUID;
  session_record RECORD;
  result JSONB;
BEGIN
  -- Get or create session
  session_id := get_or_create_session(user_uuid, conversation_uuid, avatar_id_param);
  
  -- Update session activity
  PERFORM update_session_activity(session_id, 1);
  
  -- Get updated session info
  SELECT * INTO session_record
  FROM conversation_sessions
  WHERE id = session_id;
  
  -- Check if session should auto-end
  IF session_record.message_count >= 30 OR session_record.session_duration_minutes >= 60 THEN
    PERFORM end_conversation_session(session_id, true);
  END IF;
  
  -- Return session info
  result := jsonb_build_object(
    'session_id', session_id,
    'message_count', session_record.message_count,
    'duration_minutes', session_record.session_duration_minutes,
    'credit_charged', session_record.credit_charged,
    'is_active', session_record.is_active
  );
  
  RETURN result;
END;
$$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON conversation_sessions TO authenticated;
GRANT ALL ON conversation_sessions TO service_role;
GRANT EXECUTE ON FUNCTION start_conversation_session(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION update_session_activity(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION end_conversation_session(UUID, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_inactive_sessions() TO service_role;
GRANT EXECUTE ON FUNCTION get_or_create_session(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION process_message_with_session(UUID, UUID, TEXT, TEXT) TO service_role;

-- Update subscription tiers for session-based model
UPDATE subscription_tiers SET
  monthly_credits = CASE 
    WHEN id = 'free' THEN 5        -- 5 conversation sessions/month
    WHEN id = 'basic' THEN 50      -- 50 conversation sessions/month (~1.6/day)
    WHEN id = 'premium' THEN 150   -- 150 conversation sessions/month (~5/day)
    WHEN id = 'pro' THEN 400       -- 400 conversation sessions/month (~13/day)
    ELSE monthly_credits
  END,
  max_rollover = CASE 
    WHEN id = 'free' THEN 10
    WHEN id = 'basic' THEN 100
    WHEN id = 'premium' THEN 300
    WHEN id = 'pro' THEN 800
    ELSE max_rollover
  END,
  description = CASE 
    WHEN id = 'free' THEN 'Perfect for trying out the app with 5 therapy sessions per month'
    WHEN id = 'basic' THEN 'Great for regular users with 50 therapy sessions per month'
    WHEN id = 'premium' THEN 'Perfect for frequent users with 150 therapy sessions per month'
    WHEN id = 'pro' THEN 'Ideal for professionals with 400 therapy sessions per month'
    ELSE description
  END
WHERE id IN ('free', 'basic', 'premium', 'pro');

-- Update credit packages for session-based model
UPDATE credit_packages SET
  credits = CASE 
    WHEN id = 'starter' THEN 10     -- 10 conversation sessions
    WHEN id = 'basic' THEN 25       -- 25 conversation sessions
    WHEN id = 'popular' THEN 75     -- 75 conversation sessions
    WHEN id = 'professional' THEN 150 -- 150 conversation sessions
    WHEN id = 'unlimited' THEN 300  -- 300 conversation sessions
    ELSE credits
  END,
  bonus_credits = CASE 
    WHEN id = 'starter' THEN 0
    WHEN id = 'basic' THEN 5
    WHEN id = 'popular' THEN 15
    WHEN id = 'professional' THEN 35
    WHEN id = 'unlimited' THEN 75
    ELSE bonus_credits
  END,
  description = CASE 
    WHEN id = 'starter' THEN 'Perfect for light usage with 10 therapy sessions'
    WHEN id = 'basic' THEN 'Great value with 30 total therapy sessions'
    WHEN id = 'popular' THEN 'Most popular choice with 90 total therapy sessions'
    WHEN id = 'professional' THEN 'For power users with 185 total therapy sessions'
    WHEN id = 'unlimited' THEN 'Maximum value with 375 total therapy sessions'
    ELSE description
  END
WHERE id IN ('starter', 'basic', 'popular', 'professional', 'unlimited');

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_conversation_sessions_updated_at
  BEFORE UPDATE ON conversation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Log successful completion
DO $$
BEGIN
  RAISE NOTICE 'Session-based credit model implemented successfully!';
  RAISE NOTICE 'New model: 1 credit = 1 conversation session (30-60 min OR 20-30 messages)';
  RAISE NOTICE 'This provides excellent user experience with natural therapy boundaries';
  RAISE NOTICE 'Users can now have complete, uninterrupted therapy conversations';
END $$;
