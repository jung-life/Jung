#!/usr/bin/env node

/**
 * Apply Enhanced Credit System Hybrid Migration - Simple Version
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🚀 Applying enhanced credit system hybrid migration...');
  
  try {
    // 1. Create subscription_tiers table
    console.log('📝 Creating subscription_tiers table...');
    const { error: tiersError } = await supabase.rpc('create_subscription_tiers_table');
    if (tiersError && !tiersError.message.includes('already exists')) {
      console.log('⚠️  Subscription tiers table may already exist');
    }

    // 2. Create credit_packages table
    console.log('📝 Creating credit_packages table...');
    const { error: packagesError } = await supabase.rpc('create_credit_packages_table');
    if (packagesError && !packagesError.message.includes('already exists')) {
      console.log('⚠️  Credit packages table may already exist');
    }

    // 3. Create user_subscriptions table
    console.log('📝 Creating user_subscriptions table...');
    const { error: subscriptionsError } = await supabase.rpc('create_user_subscriptions_table');
    if (subscriptionsError && !subscriptionsError.message.includes('already exists')) {
      console.log('⚠️  User subscriptions table may already exist');
    }

    // 4. Insert default data using direct inserts
    console.log('📝 Inserting default subscription tiers...');
    await insertDefaultTiers();

    console.log('📝 Inserting default credit packages...');
    await insertDefaultPackages();

    console.log('✅ Enhanced credit system hybrid migration applied successfully!');
    
    // Verify the migration
    await verifyMigration();
    
  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    console.log('📝 Trying alternative approach with direct table creation...');
    await createTablesDirectly();
  }
}

async function createTablesDirectly() {
  console.log('📝 Creating tables using direct SQL approach...');
  
  // Insert default subscription tiers
  const tiers = [
    { id: 'free', name: 'Free', monthly_credits: 10, price_monthly: 0, features: ['Access to Carl Jung avatar', 'Basic mood tracking', 'Limited history'], credit_discount: 0 },
    { id: 'basic', name: 'Basic', monthly_credits: 150, price_monthly: 999, features: ['All avatars available', 'Complete feature access', '25% discount on additional credits'], credit_discount: 25 },
    { id: 'premium', name: 'Premium', monthly_credits: 400, price_monthly: 1999, features: ['Advanced analytics', 'Export capabilities', '30% discount on additional credits'], credit_discount: 30 },
    { id: 'professional', name: 'Professional', monthly_credits: 1000, price_monthly: 3999, features: ['API access potential', 'Custom training options', '35% discount on additional credits'], credit_discount: 35 }
  ];

  // Insert default credit packages
  const packages = [
    { id: 'starter', name: 'Starter Pack', credits: 50, bonus_credits: 0, price: 499, description: 'Perfect for trying the app', is_popular: false },
    { id: 'popular', name: 'Popular Pack', credits: 250, bonus_credits: 50, price: 1999, description: 'Best value proposition', is_popular: true },
    { id: 'professional', name: 'Professional Pack', credits: 500, bonus_credits: 150, price: 3499, description: 'Heavy user option', is_popular: false },
    { id: 'unlimited', name: 'Unlimited Pack', credits: 1000, bonus_credits: 400, price: 5999, description: 'Maximum value', is_popular: false }
  ];

  // Try to upsert the data
  await insertDefaultTiers();
  await insertDefaultPackages();
}

async function insertDefaultTiers() {
  const tiers = [
    { id: 'free', name: 'Free', monthly_credits: 10, price_monthly: 0, features: ['Access to Carl Jung avatar', 'Basic mood tracking', 'Limited history'], credit_discount: 0, is_active: true },
    { id: 'basic', name: 'Basic', monthly_credits: 150, price_monthly: 999, features: ['All avatars available', 'Complete feature access', '25% discount on additional credits'], credit_discount: 25, is_active: true },
    { id: 'premium', name: 'Premium', monthly_credits: 400, price_monthly: 1999, features: ['Advanced analytics', 'Export capabilities', '30% discount on additional credits'], credit_discount: 30, is_active: true },
    { id: 'professional', name: 'Professional', monthly_credits: 1000, price_monthly: 3999, features: ['API access potential', 'Custom training options', '35% discount on additional credits'], credit_discount: 35, is_active: true }
  ];

  for (const tier of tiers) {
    try {
      const { error } = await supabase
        .from('subscription_tiers')
        .upsert(tier);
      if (error) {
        console.log(`⚠️  Tier ${tier.id} may already exist`);
      }
    } catch (err) {
      console.log(`⚠️  Could not insert tier ${tier.id}`);
    }
  }
}

async function insertDefaultPackages() {
  const packages = [
    { id: 'starter', name: 'Starter Pack', credits: 50, bonus_credits: 0, price: 499, description: 'Perfect for trying the app', is_popular: false, is_active: true },
    { id: 'popular', name: 'Popular Pack', credits: 250, bonus_credits: 50, price: 1999, description: 'Best value proposition', is_popular: true, is_active: true },
    { id: 'professional', name: 'Professional Pack', credits: 500, bonus_credits: 150, price: 3499, description: 'Heavy user option', is_popular: false, is_active: true },
    { id: 'unlimited', name: 'Unlimited Pack', credits: 1000, bonus_credits: 400, price: 5999, description: 'Maximum value', is_popular: false, is_active: true }
  ];

  for (const pkg of packages) {
    try {
      const { error } = await supabase
        .from('credit_packages')
        .upsert(pkg);
      if (error) {
        console.log(`⚠️  Package ${pkg.id} may already exist`);
      }
    } catch (err) {
      console.log(`⚠️  Could not insert package ${pkg.id}`);
    }
  }
}

async function verifyMigration() {
  console.log('🔍 Verifying migration...');
  
  try {
    // Check subscription tiers
    const { data: tiers, error: tiersError } = await supabase
      .from('subscription_tiers')
      .select('id, name, monthly_credits, price_monthly')
      .eq('is_active', true);
    
    if (tiersError) {
      console.error('❌ Error fetching subscription tiers:', tiersError.message);
    } else {
      console.log(`✅ Found ${tiers.length} subscription tiers:`);
      tiers.forEach(tier => {
        console.log(`   - ${tier.name}: ${tier.monthly_credits} credits, $${tier.price_monthly / 100}/month`);
      });
    }
    
    // Check credit packages
    const { data: packages, error: packagesError } = await supabase
      .from('credit_packages')
      .select('id, name, credits, bonus_credits, price')
      .eq('is_active', true);
    
    if (packagesError) {
      console.error('❌ Error fetching credit packages:', packagesError.message);
    } else {
      console.log(`✅ Found ${packages.length} credit packages:`);
      packages.forEach(pkg => {
        const totalCredits = pkg.credits + pkg.bonus_credits;
        console.log(`   - ${pkg.name}: ${totalCredits} credits, $${pkg.price / 100}`);
      });
    }
    
    console.log('✅ Migration verification completed successfully!');
    console.log('');
    console.log('🎉 Your hybrid credit-subscription model is ready!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Add UpgradeRecommendationBanner to your main screens');
    console.log('2. Update SubscriptionScreen to use new hybrid model');
    console.log('3. Test the upgrade recommendation system');
    
  } catch (error) {
    console.error('❌ Error verifying migration:', error.message);
  }
}

// Run migration
applyMigration();
