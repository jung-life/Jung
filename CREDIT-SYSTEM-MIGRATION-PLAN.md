# Credit-Based Subscription System Migration Plan

## Overview
Transition from flat subscription model to a credit-based system to better align costs with usage and provide fair pricing for users with different conversation volumes.

## Current Issues with Flat Model
- Heavy users can cause excessive API costs vs. subscription revenue
- Light users overpay for minimal usage
- No usage analytics or cost control
- Binary premium/free access doesn't match actual costs

## Credit System Design

### Credit Types & Costs
```
1 Credit = 1 LLM API Call (roughly 1 conversation turn)

Estimated API costs:
- Claude 3.5 Sonnet: ~$0.003 per message
- GPT-4: ~$0.002 per message
- Average cost per credit: $0.0025

Credit pricing (with margin):
- 1 Credit = $0.01 (400% margin for sustainability)
```

### Credit Packages
```
Starter Pack:     50 credits  = $4.99  ($0.10/credit) - 25% savings
Basic Pack:      100 credits  = $8.99  ($0.09/credit) - 10% savings  
Popular Pack:    250 credits  = $19.99 ($0.08/credit) - 20% savings
Professional:    500 credits  = $34.99 ($0.07/credit) - 30% savings
Unlimited:      1000 credits  = $59.99 ($0.06/credit) - 40% savings
```

### Subscription Tiers (Hybrid Model)
```
Free Tier:
- 10 credits/month (renewable)
- Basic avatars only
- Standard response time

Basic Subscription ($9.99/month):
- 150 credits/month + rollover up to 300
- All avatars unlocked
- Priority response processing
- Conversation insights

Premium Subscription ($19.99/month):
- 400 credits/month + rollover up to 800
- All features unlocked
- Advanced conversation analytics
- Export conversations
- Priority support

Pro Subscription ($39.99/month):
- 1000 credits/month + rollover up to 2000
- Everything in Premium
- Custom avatar training (future feature)
- API access (future feature)
```

## Database Schema Changes

### New Tables Required

#### user_credits
```sql
CREATE TABLE user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  last_monthly_grant TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### credit_transactions
```sql
CREATE TABLE credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'purchased', 'granted', 'expired')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('subscription', 'purchase', 'usage', 'promotion', 'refund')),
  source_id TEXT, -- Reference to purchase, message, etc.
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### subscription_tiers
```sql
CREATE TABLE subscription_tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  monthly_credits INTEGER NOT NULL,
  max_rollover INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  features JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### message_costs
```sql
CREATE TABLE message_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  avatar_id TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  credits_charged INTEGER NOT NULL DEFAULT 1,
  api_cost_cents INTEGER,
  provider TEXT NOT NULL DEFAULT 'claude',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Implementation Phases

### Phase 1: Database Migration (Week 1)
1. Create new credit-related tables
2. Migrate existing users to credit system
3. Grant credits based on current subscription status
4. Update RLS policies

### Phase 2: Backend Credit Management (Week 2)
1. Create credit management service
2. Implement credit deduction for messages
3. Add subscription tier management
4. Create credit purchase flow

### Phase 3: Frontend Updates (Week 2-3)
1. Update subscription screen for credit packages
2. Add credit balance display
3. Implement usage tracking UI
4. Create credit purchase components

### Phase 4: Migration & Testing (Week 3-4)
1. Migrate existing subscriptions
2. Comprehensive testing
3. Gradual rollout
4. Monitor usage patterns

## Migration Strategy

### Existing Users
```
Current Monthly Subscribers -> Basic Tier (150 credits/month)
Current Yearly Subscribers -> Premium Tier (400 credits/month) 
Current Free Users -> Free Tier (10 credits/month)

Grace period: 30 days to adjust to new system
Grandfathered pricing for 6 months
```

### Communication Plan
1. **2 weeks before**: Email announcement explaining benefits
2. **1 week before**: In-app notification with FAQ
3. **Day of launch**: Welcome guide for new credit system
4. **1 week after**: Check-in email with usage stats

## Risk Mitigation

### User Adoption Risks
- **Solution**: Grandfathered pricing + generous migration credits
- **Fallback**: Option to keep flat rate for existing users

### Technical Risks  
- **Solution**: Gradual rollout with feature flags
- **Monitoring**: Real-time credit balance tracking

### Revenue Risks
- **Solution**: Conservative credit pricing with healthy margins
- **Analytics**: Track revenue per user before/after migration

## Success Metrics

### Financial
- Revenue per user (RPU)
- Customer lifetime value (CLV)
- Gross margin improvement
- Subscription retention rate

### Usage
- Credits used per user per month
- Feature adoption rates
- Support ticket volume
- User satisfaction scores

## Next Steps

1. **Database Design Review**: Validate schema with team
2. **API Cost Analysis**: Precise tracking of actual LLM costs
3. **Pricing Model Testing**: A/B test different credit prices
4. **Technical Implementation**: Start with credit management service
5. **User Research**: Survey current users about credit preferences
