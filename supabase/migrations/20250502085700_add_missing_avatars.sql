-- supabase/migrations/20250502085700_add_missing_avatars.sql

-- Ensure all avatars defined in the frontend exist in the database
-- Assuming the 'avatars' table has 'id' (TEXT) and 'name' (TEXT) columns.
-- Adjust column names if necessary based on your actual schema.

INSERT INTO public.avatars (id, name) VALUES
  ('jung', 'Carl Jung'),
  ('freud', 'Sigmund Freud'),
  ('adler', 'Alfred Adler'),
  ('rogers', 'Carl Rogers'),
  ('frankl', 'Viktor Frankl'),
  ('maslow', 'Abraham Maslow'),
  ('horney', 'Karen Horney'),
  ('oracle', 'Sage'),          -- Using 'Sage' as the name based on AvatarSelector
  ('morpheus', 'Awakener')     -- Using 'Awakener' as the name based on AvatarSelector
ON CONFLICT (id) DO NOTHING; -- Avoid errors if avatars already exist
