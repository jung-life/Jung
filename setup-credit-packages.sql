-- Setup credit packages for Jung app
-- Run this with: supabase db push or through Supabase CLI

-- Insert sample credit packages
INSERT INTO credit_packages (
  name, 
  description, 
  credits, 
  price_cents, 
  bonus_credits, 
  total_credits, 
  is_active, 
  sort_order
) VALUES
  (
    'Starter Pack',
    '100 credits to get you started with AI conversations',
    100,
    499,  -- $4.99
    0,
    100,
    true,
    1
  ),
  (
    'Value Pack',
    '500 credits plus 50 bonus credits - our most popular option',
    500,
    1999, -- $19.99
    50,
    550,
    true,
    2
  ),
  (
    'Premium Pack',
    '1000 credits plus 200 bonus credits - best value for power users',
    1000,
    2999, -- $29.99
    200,
    1200,
    true,
    3
  ),
  (
    'Mega Pack',
    '2500 credits plus 500 bonus credits - unlimited conversations',
    2500,
    4999, -- $49.99
    500,
    3000,
    true,
    4
  )
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  credits = EXCLUDED.credits,
  price_cents = EXCLUDED.price_cents,
  bonus_credits = EXCLUDED.bonus_credits,
  total_credits = EXCLUDED.total_credits,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- Verify the data was inserted
SELECT 
  name,
  credits,
  bonus_credits,
  total_credits,
  CONCAT('$', (price_cents::float / 100)::text) as price,
  is_active,
  sort_order
FROM credit_packages 
WHERE is_active = true 
ORDER BY sort_order;
