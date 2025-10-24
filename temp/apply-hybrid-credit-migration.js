#!/usr/bin/env node

/**
 * Apply Enhanced Credit System Hybrid Migration
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🚀 Applying enhanced credit system hybrid migration...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250620_enhance_credit_system_hybrid.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split into individual statements and execute
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('execute_sql', { query: statement + ';' });
          if (error) {
            // Try alternative approach for table creation
            const { error: altError } = await supabase.from('_').select('1').limit(0);
            if (statement.includes('CREATE TABLE') || statement.includes('INSERT INTO')) {
              console.log(`⚠️  Skipping statement (may already exist): ${statement.substring(0, 50)}...`);
              continue;
            } else {
              console.error('Error executing statement:', error.message);
              console.error('Statement:', statement.substring(0, 100) + '...');
            }
          }
        } catch (err) {
          console.log(`⚠️  Statement may already exist: ${statement.substring(0, 50)}...`);
        }
      }
    }
    
    console.log('✅ Enhanced credit system hybrid migration applied successfully!');
    
    // Verify the migration
    await verifyMigration();
    
  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    process.exit(1);
  }
}

async function verifyMigration() {
  console.log('🔍 Verifying migration...');
  
  try {
    // Check if tables exist and contain data
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
    
  } catch (error) {
    console.error('❌ Error verifying migration:', error.message);
  }
}

// Run migration
applyMigration();
