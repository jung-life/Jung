# Credit System Installation Guide

Since the automated migration script has limitations with the Node.js Supabase client, here's a step-by-step manual installation guide.

## 🚀 Quick Installation (5 minutes)

### Step 1: Apply Database Migration

**Option A: Supabase Dashboard (Recommended)**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project: `osmhesmrvxusckjfxugr`
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy the entire contents of `supabase/migrations/20250619_create_credit_system.sql`
6. Paste it into the SQL Editor
7. Click "Run" (this will take 10-15 seconds)

**Option B: Supabase CLI**
```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Link your project
supabase link --project-ref osmhesmrvxusckjfxugr

# Push the migration
supabase db push
```

### Step 2: Verify Installation

Run this query in the SQL Editor to verify everything is working:

```sql
-- Check if tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('subscription_tiers', 'user_credits', 'credit_transactions', 'message_costs', 'credit_packages');

-- Check subscription tiers
SELECT id, name, monthly_credits, price_cents FROM subscription_tiers WHERE is_active = true;

-- Check credit packages
SELECT id, name, total_credits, price_cents FROM credit_packages WHERE is_active = true;
```

You should see:
- ✅ 5 tables created
- ✅ 4 subscription tiers (Free, Basic, Premium, Pro)
- ✅ 5 credit packages (Starter to Unlimited)

### Step 3: Migrate Existing Users (Optional)

If you have existing users, run this to migrate them:

```sql
SELECT migrate_users_to_credit_system();
```

## 📋 What Was Installed

### Database Tables
- **`subscription_tiers`** - Subscription plans with credit allowances
- **`user_credits`** - Each user's credit balance and tier
- **`credit_transactions`** - Audit trail of all credit operations
- **`message_costs`** - Track API costs and usage per message
- **`credit_packages`** - One-time credit purchase options

### Functions
- **`get_user_credit_balance(user_id)`** - Get user's current balance
- **`has_sufficient_credits(user_id, amount)`** - Check if user can afford operation
- **`spend_credits(user_id, amount, ...)`** - Deduct credits with logging
- **`add_credits(user_id, amount, ...)`** - Add credits with logging
- **`grant_monthly_credits()`** - Monthly subscription credit renewal
- **`migrate_users_to_credit_system()`** - One-time migration function

### Pre-loaded Data

**Subscription Tiers:**
- **Free**: 10 credits/month ($0)
- **Basic**: 150 credits/month ($9.99)
- **Premium**: 400 credits/month ($19.99)
- **Pro**: 1000 credits/month ($39.99)

**Credit Packages:**
- **Starter**: 50 credits ($4.99)
- **Basic**: 110 credits ($8.99)
- **Popular**: 300 credits ($19.99)
- **Professional**: 650 credits ($34.99)
- **Unlimited**: 1400 credits ($59.99)

## 🔧 Frontend Integration

### 1. Update ChatScreen to Use Credits

```typescript
import { useCredits } from '../hooks/useCredits';
import { creditService } from '../lib/creditService';

const ChatScreen = () => {
  const { hasCredits, spendCredits, creditBalance } = useCredits();
  
  const handleSendMessage = async () => {
    // Check credits before sending
    if (!hasCredits(1)) {
      Alert.alert(
        'No Credits',
        'You need credits to send messages. Would you like to purchase more?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy Credits', onPress: () => navigation.navigate('SubscriptionScreen') }
        ]
      );
      return;
    }
    
    // Send message to AI
    const aiResponse = await generateAIResponse(inputText, messages, avatarId);
    
    // Deduct credit after successful response
    const success = await spendCredits(1, `Chat with ${avatarId}`);
    
    if (!success) {
      Alert.alert('Error', 'Failed to deduct credits');
      return;
    }
    
    // Record message cost for analytics
    await creditService.recordMessageCost(
      messageId,
      userId,
      conversationId,
      avatarId,
      inputTokens,
      outputTokens,
      1, // credits charged
      estimatedApiCost,
      'claude',
      'claude-3-5-sonnet'
    );
    
    // Continue with your existing message handling...
  };
};
```

### 2. Display Credit Balance

```typescript
import { useCredits } from '../hooks/useCredits';

const CreditDisplay = () => {
  const { creditBalance, loading } = useCredits();
  
  if (loading) return <ActivityIndicator />;
  
  return (
    <View style={styles.creditContainer}>
      <Text style={styles.creditText}>
        {creditBalance?.currentBalance || 0} credits
      </Text>
      <Text style={styles.tierText}>
        {creditBalance?.subscriptionTierId || 'Free'} tier
      </Text>
    </View>
  );
};
```

### 3. Update Subscription Screen

```typescript
import { useCredits } from '../hooks/useCredits';

const SubscriptionScreen = () => {
  const { availableTiers, creditPackages } = useCredits();
  
  return (
    <ScrollView>
      {/* Subscription Tiers */}
      <Text style={styles.sectionTitle}>Monthly Subscriptions</Text>
      {availableTiers.map(tier => (
        <SubscriptionTierCard key={tier.id} tier={tier} />
      ))}
      
      {/* Credit Packages */}
      <Text style={styles.sectionTitle}>One-time Credit Packages</Text>
      {creditPackages.map(pkg => (
        <CreditPackageCard key={pkg.id} package={pkg} />
      ))}
    </ScrollView>
  );
};
```

## ⚙️ Monthly Credit Grants

Set up a cron job or Supabase Edge Function to grant monthly credits:

```sql
-- Run this monthly (1st of each month)
SELECT grant_monthly_credits();
```

Or create a Supabase Edge Function:

```typescript
// supabase/functions/grant-monthly-credits/index.ts
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: Request) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  const { data, error } = await supabase.rpc('grant_monthly_credits')
  
  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500 })
  }
  
  return new Response(JSON.stringify({ 
    message: `Granted credits to ${data} users` 
  }))
}
```

## 📊 Analytics & Monitoring

Monitor your credit system:

```sql
-- Daily usage stats
SELECT 
  DATE(created_at) as date,
  COUNT(*) as messages,
  SUM(credits_charged) as credits_used,
  SUM(api_cost_cents) as total_cost_cents
FROM message_costs 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Top spending users
SELECT 
  u.email,
  SUM(mc.credits_charged) as total_credits_used,
  SUM(mc.api_cost_cents) as total_api_cost_cents
FROM message_costs mc
JOIN auth.users u ON mc.user_id = u.id
WHERE mc.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.email
ORDER BY total_credits_used DESC
LIMIT 10;

-- Credit balance distribution
SELECT 
  CASE 
    WHEN current_balance = 0 THEN '0 credits'
    WHEN current_balance BETWEEN 1 AND 10 THEN '1-10 credits'
    WHEN current_balance BETWEEN 11 AND 50 THEN '11-50 credits'
    WHEN current_balance BETWEEN 51 AND 100 THEN '51-100 credits'
    ELSE '100+ credits'
  END as balance_range,
  COUNT(*) as user_count
FROM user_credits
GROUP BY balance_range
ORDER BY MIN(current_balance);
```

## 🚨 Troubleshooting

### Common Issues

**1. Migration fails with permission errors**
- Ensure you're using the service role key, not the anon key
- Check that RLS policies allow your operations

**2. Credit functions don't work**
- Verify all functions were created: `\df *credit*` in SQL editor
- Check function permissions with: `SELECT * FROM pg_proc WHERE proname LIKE '%credit%';`

**3. Users not migrated**
- Run migration manually: `SELECT migrate_users_to_credit_system();`
- Check existing subscriptions: `SELECT * FROM user_subscriptions LIMIT 5;`

### Reset Credit System (if needed)

```sql
-- WARNING: This will delete all credit data
DROP TABLE IF EXISTS message_costs CASCADE;
DROP TABLE IF EXISTS credit_transactions CASCADE;
DROP TABLE IF EXISTS user_credits CASCADE;
DROP TABLE IF EXISTS credit_packages CASCADE;
DROP TABLE IF EXISTS subscription_tiers CASCADE;
-- Then re-run the migration
```

## ✅ Verification Checklist

- [ ] All 5 tables created successfully
- [ ] Default subscription tiers loaded (4 tiers)
- [ ] Default credit packages loaded (5 packages)
- [ ] All SQL functions working
- [ ] Existing users migrated (if applicable)
- [ ] Frontend updated to use new credit system
- [ ] Credit balance displayed in UI
- [ ] Credit checks before API calls
- [ ] Monthly credit grant scheduled

## 🎯 Next Steps

1. **Test the system** with a real user flow
2. **Monitor usage** for the first few days
3. **Adjust pricing** based on actual API costs
4. **Set up monitoring** for low credit balances
5. **Implement push notifications** for credit alerts

Your credit-based subscription system is now ready! 🎉
