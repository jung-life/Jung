-- supabase/migrations/20250415044000_fix_profiles_column_type.sql
-- Attempt to fix the profile creation error by ensuring the column
-- referencing auth.users.id in the profiles table is of type UUID.
-- This migration tries to alter both 'id' and 'user_id' columns if they exist.

DO $$
BEGIN
  -- Attempt to alter 'id' column to UUID if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='id') THEN
    BEGIN
      -- Check current data type before altering
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='id' AND udt_name != 'uuid') THEN
        ALTER TABLE public.profiles ALTER COLUMN id TYPE UUID USING id::uuid;
        RAISE NOTICE 'Altered profiles.id column type to UUID.';
      ELSE
        RAISE NOTICE 'Column profiles.id is already UUID or does not need alteration.';
      END IF;
    EXCEPTION
      WHEN others THEN
        RAISE NOTICE 'Could not alter profiles.id to UUID. It might contain incompatible data. SQLSTATE: % SQLERRM: %', SQLSTATE, SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Column profiles.id does not exist.';
  END IF;

  -- Attempt to alter 'user_id' column to UUID if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='user_id') THEN
    BEGIN
      -- Check current data type before altering
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='user_id' AND udt_name != 'uuid') THEN
        ALTER TABLE public.profiles ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
        RAISE NOTICE 'Altered profiles.user_id column type to UUID.';
      ELSE
         RAISE NOTICE 'Column profiles.user_id is already UUID or does not need alteration.';
      END IF;
    EXCEPTION
      WHEN others THEN
        RAISE NOTICE 'Could not alter profiles.user_id to UUID. It might contain incompatible data. SQLSTATE: % SQLERRM: %', SQLSTATE, SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Column profiles.user_id does not exist.';
  END IF;
END $$;

-- Additionally, ensure the foreign key constraint references auth.users.id
-- Assuming the correct column is 'user_id' after the potential type change above.
DO $$
DECLARE
  constraint_exists BOOLEAN;
  user_id_col_exists_is_uuid BOOLEAN;
BEGIN
  -- Check if the user_id column exists and is UUID
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='user_id' AND udt_name='uuid'
  ) INTO user_id_col_exists_is_uuid;

  IF user_id_col_exists_is_uuid THEN
      -- Check if the specific foreign key constraint already exists
      SELECT EXISTS (
          SELECT 1 FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name='profiles' AND kcu.column_name='user_id'
          AND ccu.table_schema = 'auth' AND ccu.table_name='users' AND ccu.column_name='id'
          -- AND tc.constraint_name = 'profiles_user_id_fkey' -- Loosen check: any FK on user_id to auth.users.id
      ) INTO constraint_exists;

      IF NOT constraint_exists THEN
          -- Drop potentially incorrect constraints before adding the correct one
          -- Drop constraint if it exists on profiles.user_id but points elsewhere
          -- Drop constraint if it exists on profiles.id pointing to auth.users.id
          -- (This requires knowing the constraint names, which we don't)
          -- Safest to just try adding the desired one. If it conflicts, the DB will raise an error.
          BEGIN
              ALTER TABLE public.profiles
              ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id)
              REFERENCES auth.users (id) ON DELETE CASCADE;
              RAISE NOTICE 'Added foreign key constraint profiles_user_id_fkey (profiles.user_id -> auth.users.id).';
          EXCEPTION
              WHEN duplicate_object THEN
                  RAISE NOTICE 'Foreign key constraint on profiles.user_id to auth.users.id already exists or conflicts.';
              WHEN others THEN
                  RAISE NOTICE 'Could not add foreign key constraint profiles_user_id_fkey. SQLSTATE: % SQLERRM: %', SQLSTATE, SQLERRM;
          END;
      ELSE
          RAISE NOTICE 'A foreign key constraint on profiles.user_id referencing auth.users.id already exists.';
      END IF;
  ELSE
      RAISE NOTICE 'Cannot ensure foreign key constraint: profiles.user_id column does not exist or is not UUID type.';
  END IF;
END $$;
