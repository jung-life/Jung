-- supabase/migrations/20250502085700_add_missing_avatars.sql

-- Ensure uuid-ossp extension is enabled for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Insert missing avatars into the public.avatars table
-- Uses ON CONFLICT on the unique 'avatar_id' (text slug) column.
-- If an avatar_id exists, it updates the other fields.

INSERT INTO public.avatars (id, avatar_id, name, description, image_url, "order") VALUES
  (uuid_generate_v4(), 'jung', 'Carl Jung', 'Analytical psychology focused on the psyche through exploring dreams, art, mythology, religion, and philosophy.', '/assets/avatars/jung.png', 1),
  (uuid_generate_v4(), 'freud', 'Sigmund Freud', 'Founder of psychoanalysis focusing on unconscious mind, defense mechanisms, and childhood experiences.', '/assets/avatars/freud.png', 2),
  (uuid_generate_v4(), 'adler', 'Alfred Adler', 'Individual psychology emphasizing social interest, inferiority feelings, and striving for superiority.', '/assets/avatars/adler.png', 3),
  (uuid_generate_v4(), 'rogers', 'Carl Rogers', 'Person-centered approach focusing on empathy, unconditional positive regard, and authenticity.', '/assets/avatars/rogers.png', 4),
  (uuid_generate_v4(), 'frankl', 'Viktor Frankl', 'Logotherapy focusing on finding meaning in life and overcoming suffering.', '/assets/avatars/frankl.png', 5),
  (uuid_generate_v4(), 'maslow', 'Abraham Maslow', 'Humanistic psychology focusing on self-actualization and the hierarchy of needs.', '/assets/avatars/maslow.png', 6),
  (uuid_generate_v4(), 'horney', 'Karen Horney', 'Neo-Freudian psychology focusing on cultural influences and self-realization.', '/assets/avatars/horney.png', 7),
  (uuid_generate_v4(), 'oracle', 'Sage', 'Wisdom-based approach focusing on intuition, pattern recognition, and holistic understanding of life situations.', '/assets/avatars/oracle.png', 8),
  (uuid_generate_v4(), 'morpheus', 'Awakener', 'Transformative approach that challenges perceptions, encourages critical thinking, and promotes personal liberation.', '/assets/avatars/morpheus.png', 9)
ON CONFLICT (avatar_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  "order" = EXCLUDED."order"; -- Update fields if avatar_id (slug) already exists
