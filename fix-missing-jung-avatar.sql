-- Fix missing "jung" avatar in Supabase database
-- This script adds the missing "jung" avatar to the avatars table

-- Insert the missing "jung" avatar
INSERT INTO avatars (id, name, description, image_url, personality_traits, specialization, created_at, updated_at)
VALUES (
    'jung',
    'Carl Jung',
    'The pioneering Swiss psychiatrist and psychoanalyst who founded analytical psychology',
    'https://your-cdn-url.com/jung-avatar.png', -- Replace with actual image URL
    ARRAY['analytical', 'insightful', 'psychological', 'archetypal', 'introspective'],
    'Jungian Psychology and Analytical Therapy',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    personality_traits = EXCLUDED.personality_traits,
    specialization = EXCLUDED.specialization,
    updated_at = NOW();

-- Verify the avatar was created
SELECT * FROM avatars WHERE id = 'jung';
