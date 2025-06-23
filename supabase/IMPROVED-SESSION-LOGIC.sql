-- Improved Session Logic - Prevents Revenue Loss
-- This fixes the loophole where users could avoid credit charges

-- Update the session end logic to prevent abuse
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
  
  -- IMPROVED LOGIC: More aggressive credit charging to prevent abuse
  -- Charge if: 15+ minutes OR 10+ messages OR force_end
  -- This ensures users can't easily game the system
  should_charge := (
    session_record.session_duration_minutes >= 15 OR  -- Reduced from 30 to 15 minutes
    session_record.message_count >= 10 OR             -- Reduced from 20 to 10 messages
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

-- Also update the session activity function to be more aggressive about ending sessions
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
  
  -- AUTO-END SESSION if limits reached (prevents gaming)
  IF current_messages >= 20 OR duration_minutes >= 30 THEN
    PERFORM end_conversation_session(session_uuid, true);
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Update the cleanup function to be more aggressive about charging
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record RECORD;
  sessions_ended INTEGER := 0;
BEGIN
  -- Find sessions inactive for 15+ minutes (reduced from 30)
  -- OR sessions with 10+ messages (new safeguard)
  FOR session_record IN
    SELECT id, user_id, last_activity, session_duration_minutes, message_count
    FROM conversation_sessions
    WHERE is_active = true
      AND (
        last_activity < NOW() - INTERVAL '15 minutes' OR  -- Reduced inactivity threshold
        message_count >= 10                               -- New message-based cleanup
      )
  LOOP
    -- End the session (this will handle credit charging with new aggressive logic)
    PERFORM end_conversation_session(session_record.id, false);
    sessions_ended := sessions_ended + 1;
  END LOOP;
  
  RETURN sessions_ended;
END;
$$;

-- Create a function to track potential abuse and implement additional safeguards
CREATE OR REPLACE FUNCTION detect_session_abuse(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recent_sessions INTEGER;
  uncharged_sessions INTEGER;
  abuse_score INTEGER := 0;
  result JSONB;
BEGIN
  -- Count recent sessions (last 24 hours)
  SELECT COUNT(*) INTO recent_sessions
  FROM conversation_sessions
  WHERE user_id = user_uuid
    AND start_time > NOW() - INTERVAL '24 hours';
  
  -- Count uncharged sessions (last 7 days)
  SELECT COUNT(*) INTO uncharged_sessions
  FROM conversation_sessions
  WHERE user_id = user_uuid
    AND credit_charged = false
    AND start_time > NOW() - INTERVAL '7 days';
  
  -- Calculate abuse score
  abuse_score := uncharged_sessions * 2;  -- Heavy penalty for uncharged sessions
  
  IF recent_sessions > 10 THEN  -- More than 10 sessions per day
    abuse_score := abuse_score + 5;
  END IF;
  
  result := jsonb_build_object(
    'recent_sessions', recent_sessions,
    'uncharged_sessions', uncharged_sessions,
    'abuse_score', abuse_score,
    'is_suspicious', abuse_score > 5
  );
  
  RETURN result;
END;
$$;

-- Enhanced function that includes abuse detection
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
  abuse_data JSONB;
  result JSONB;
BEGIN
  -- Check for potential abuse first
  abuse_data := detect_session_abuse(user_uuid);
  
  -- If abuse detected, force minimum session billing
  IF (abuse_data->>'is_suspicious')::boolean THEN
    -- For suspicious users, charge immediately after 5 messages or 10 minutes
    session_id := get_or_create_session(user_uuid, conversation_uuid, avatar_id_param);
    PERFORM update_session_activity(session_id, 1);
    
    SELECT * INTO session_record FROM conversation_sessions WHERE id = session_id;
    
    -- Aggressive charging for suspicious users
    IF session_record.message_count >= 5 OR session_record.session_duration_minutes >= 10 THEN
      PERFORM end_conversation_session(session_id, true);
    END IF;
  ELSE
    -- Normal flow for regular users
    session_id := get_or_create_session(user_uuid, conversation_uuid, avatar_id_param);
    PERFORM update_session_activity(session_id, 1);
    
    SELECT * INTO session_record FROM conversation_sessions WHERE id = session_id;
    
    -- Standard auto-end logic
    IF session_record.message_count >= 20 OR session_record.session_duration_minutes >= 30 THEN
      PERFORM end_conversation_session(session_id, true);
    END IF;
  END IF;
  
  -- Return session info with abuse data
  result := jsonb_build_object(
    'session_id', session_id,
    'message_count', session_record.message_count,
    'duration_minutes', session_record.session_duration_minutes,
    'credit_charged', session_record.credit_charged,
    'is_active', session_record.is_active,
    'abuse_detection', abuse_data
  );
  
  RETURN result;
END;
$$;

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION detect_session_abuse(UUID) TO service_role;

-- Log the improvements
DO $$
BEGIN
  RAISE NOTICE 'Session abuse prevention implemented!';
  RAISE NOTICE 'New safeguards:';
  RAISE NOTICE '• Credit charged after 15 minutes (was 30)';
  RAISE NOTICE '• Credit charged after 10 messages (was 20)';
  RAISE NOTICE '• Automatic session cleanup at 15 minutes inactivity';
  RAISE NOTICE '• Abuse detection for users with many uncharged sessions';
  RAISE NOTICE '• Aggressive billing for suspicious users (5 messages/10 minutes)';
  RAISE NOTICE 'Revenue protection: Users cannot easily avoid credit charges!';
END $$;
