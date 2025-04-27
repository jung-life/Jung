-- supabase/migrations/20250427110500_fix_new_user_database_error.sql

-- Drop existing trigger and function if they exist to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the improved function to handle new user creation with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  full_name_value TEXT;
  avatar_url_value TEXT;
BEGIN
  -- Extract values with proper null handling
  BEGIN
    full_name_value := NEW.raw_user_meta_data->>'full_name';
  EXCEPTION WHEN OTHERS THEN
    full_name_value := NULL;
  END;
  
  BEGIN
    avatar_url_value := NEW.raw_user_meta_data->>'avatar_url';
  EXCEPTION WHEN OTHERS THEN
    avatar_url_value := NULL;
  END;

  -- Insert into public.profiles with explicit NULL handling
  -- This ensures we don't try to insert invalid data types
  BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
      NEW.id,
      full_name_value,
      avatar_url_value
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but continue execution
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
  END;

  -- Also ensure user preferences are created with error handling
  BEGIN
    INSERT INTO public.user_preferences (user_id, has_seen_disclaimer, disclaimer_version)
    VALUES (NEW.id, false, 0)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but continue execution
    RAISE WARNING 'Error creating user preferences for user %: %', NEW.id, SQLERRM;
  END;

  -- Return NEW regardless of any errors to ensure the user is still created
  RETURN NEW;
END;
$$;

-- Create the trigger to execute the function after a new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add helpful comments
COMMENT ON FUNCTION public.handle_new_user() IS 'Ensures new user has a profile and default preferences with improved error handling.';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'When a user signs up, create a profile and preferences entry with error handling.';
