-- supabase/migrations/20250415045900_redefine_handle_new_user_trigger.sql

-- Drop existing trigger and function if they exist to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public -- Important for accessing public.profiles
AS $$
BEGIN
  -- Insert into public.profiles, referencing the new user's id from auth.users
  -- Assumes public.profiles.id is of type UUID
  -- Extracts full_name and avatar_url from metadata if available
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );

  -- Also ensure user preferences are created (optional, but good practice)
  -- This duplicates logic from the app, but ensures it happens atomically
  INSERT INTO public.user_preferences (user_id, has_seen_disclaimer, disclaimer_version)
  VALUES (NEW.id, false, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create the trigger to execute the function after a new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant usage on the public schema to the necessary roles if needed
-- GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
-- GRANT ALL PRIVILEGES ON TABLE public.profiles TO postgres, anon, authenticated, service_role;
-- GRANT ALL PRIVILEGES ON TABLE public.user_preferences TO postgres, anon, authenticated, service_role;
-- Note: Adjust grants based on your specific security requirements.

COMMENT ON FUNCTION public.handle_new_user() IS 'Ensures new user has a profile and default preferences.';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'When a user signs up, create a profile and preferences entry.';
