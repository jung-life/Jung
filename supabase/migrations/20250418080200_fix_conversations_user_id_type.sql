-- supabase/migrations/20250418080200_fix_conversations_user_id_type.sql
-- Attempt to fix the data export error by ensuring the user_id column
-- in the conversations table is of type UUID.

DO $$
BEGIN
  -- Attempt to alter 'user_id' column to UUID if it exists and is not already UUID
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='conversations' AND column_name='user_id'
  ) THEN
    BEGIN
      -- Check current data type before altering
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='conversations' AND column_name='user_id' AND udt_name != 'uuid'
      ) THEN
        ALTER TABLE public.conversations ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
        RAISE NOTICE 'Altered conversations.user_id column type to UUID.';
      ELSE
        RAISE NOTICE 'Column conversations.user_id is already UUID or does not need alteration.';
      END IF;
    EXCEPTION
      WHEN others THEN
        RAISE NOTICE 'Could not alter conversations.user_id to UUID. It might contain incompatible data or be part of an existing constraint. SQLSTATE: % SQLERRM: %', SQLSTATE, SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Column conversations.user_id does not exist.';
  END IF;

  -- Additionally, ensure the foreign key constraint references auth.users.id
  -- Assuming the column is 'user_id' after the potential type change above.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='conversations' AND column_name='user_id' AND udt_name='uuid'
  ) THEN
    DECLARE
      constraint_exists BOOLEAN;
    BEGIN
        -- Check if a suitable foreign key constraint already exists
        SELECT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name='conversations' AND kcu.column_name='user_id'
            AND ccu.table_schema = 'auth' AND ccu.table_name='users' AND ccu.column_name='id'
        ) INTO constraint_exists;

        IF NOT constraint_exists THEN
            BEGIN
                -- Attempt to add the foreign key constraint
                ALTER TABLE public.conversations
                ADD CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id)
                REFERENCES auth.users (id) ON DELETE CASCADE;
                RAISE NOTICE 'Added foreign key constraint conversations_user_id_fkey (conversations.user_id -> auth.users.id).';
            EXCEPTION
                WHEN duplicate_object THEN
                    RAISE NOTICE 'Foreign key constraint on conversations.user_id to auth.users.id already exists or conflicts.';
                WHEN others THEN
                    RAISE NOTICE 'Could not add foreign key constraint conversations_user_id_fkey. SQLSTATE: % SQLERRM: %', SQLSTATE, SQLERRM;
            END;
        ELSE
            RAISE NOTICE 'A foreign key constraint on conversations.user_id referencing auth.users.id already exists.';
        END IF;
    END;
  ELSE
      RAISE NOTICE 'Cannot ensure foreign key constraint: conversations.user_id column does not exist or is not UUID type.';
  END IF;
END $$;
