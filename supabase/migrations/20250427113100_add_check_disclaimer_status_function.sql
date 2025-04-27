-- supabase/migrations/20250427113100_add_check_disclaimer_status_function.sql

-- Create or replace the check_disclaimer_status function
CREATE OR REPLACE FUNCTION public.check_disclaimer_status(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_seen BOOLEAN;
  version INTEGER;
  current_version INTEGER := 1; -- Match the CURRENT_DISCLAIMER_VERSION in the app
BEGIN
  -- Check if the user has seen the disclaimer and at what version
  SELECT 
    up.has_seen_disclaimer, 
    up.disclaimer_version 
  INTO 
    has_seen, 
    version
  FROM 
    public.user_preferences up
  WHERE 
    up.user_id = user_id_param;
    
  -- If no record found, return false
  IF has_seen IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Return true only if they've seen it and the version is current or higher
  RETURN has_seen AND version >= current_version;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error checking disclaimer status: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Add a comment to the function
COMMENT ON FUNCTION public.check_disclaimer_status IS 'Checks if a user has seen the current disclaimer version';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_disclaimer_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_disclaimer_status TO anon;
GRANT EXECUTE ON FUNCTION public.check_disclaimer_status TO service_role;
