-- supabase/migrations/20250507171800_update_avatars_to_consolidated.sql

-- Ensure uuid-ossp extension is enabled for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Insert or Update the new consolidated avatars and ensure existing ones (oracle, morpheus) are up-to-date.
-- This ensures 'depthdelver' and 'flourishingguide' exist before we try to update conversations to use them.
INSERT INTO public.avatars (id, avatar_id, name, description, image_url, "order") VALUES
  (uuid_generate_v4(), 'depthdelver', 'The Depth Delver', 'An AI guide into the profound depths of the psyche, illuminating the landscapes of the unconscious, interpreting dreams, and revealing the power of archetypes and symbols to unlock self-understanding.', '/assets/avatars/depthdelver.png', 1),
  (uuid_generate_v4(), 'flourishingguide', 'The Flourishing Guide', 'An AI companion dedicated to fostering holistic well-being. It champions empathy, guides users in discovering their unique potential, finding meaning in their experiences, building strong community connections, and navigating cultural influences for authentic self-realization.', '/assets/avatars/flourishingguide.png', 2),
  (uuid_generate_v4(), 'oracle', 'Sage', 'Wisdom-based approach focusing on intuition, pattern recognition, and holistic understanding of life situations.', '/assets/avatars/oracle.png', 3),
  (uuid_generate_v4(), 'morpheus', 'Awakener', 'Transformative approach that challenges perceptions, encourages critical thinking, and promotes personal liberation.', '/assets/avatars/morpheus.png', 4)
ON CONFLICT (avatar_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  "order" = EXCLUDED."order";

-- Step 2: Update existing conversations to point to the new consolidated avatar IDs.
UPDATE public.conversations
SET avatar_id = 'depthdelver'
WHERE avatar_id IN (
  'jung', 
  'freud', 
  'symbolsage', 
  'mindmapper'
);

UPDATE public.conversations
SET avatar_id = 'flourishingguide'
WHERE avatar_id IN (
  'adler', 
  'rogers', 
  'frankl', 
  'maslow', 
  'horney',
  'communitybuilder',
  'empathyengine',
  'meaningfinder',
  'potentialseeker',
  'culturecompass'
);

-- Step 3: Delete old, replaced avatar records from the public.avatars table.
-- These should now be safe to delete as no conversations point to them.
DELETE FROM public.avatars WHERE avatar_id IN (
  'jung', 
  'freud', 
  'adler', 
  'rogers', 
  'frankl', 
  'maslow', 
  'horney',
  'symbolsage',
  'mindmapper',
  'communitybuilder',
  'empathyengine',
  'meaningfinder',
  'potentialseeker',
  'culturecompass'
);
