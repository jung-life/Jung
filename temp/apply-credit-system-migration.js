#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Updated to match your .env file

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - EXPO_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_KEY');
  console.error('');
  console.error('Make sure these are set in your .env file');
  console.error('Current values:');
  console.error('   - EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
  console.error('   - SUPABASE_SERVICE_KEY:', supabaseServiceKey ? '✅ Found' : '❌ Missing');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 Starting Credit System Migration...\n');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20250619_create_credit_system.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found at:', migrationPath);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📖 Reading migration file...');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    // Since supabase.sql doesn't exist in Node.js client, we'll use direct database execution
    console.log('📤 Executing the entire migration as a single transaction...\n');
    
    try {
      // Try to execute the entire SQL file at once using RPC
      const { data, error } = await supabase
        .rpc('exec_sql', { sql: migrationSQL });
      
      if (error) {
        console.error('❌ RPC execution failed:', error.message);
        console.log('\n⚠️  The migration script cannot execute SQL directly through the Node.js client.');
        console.log('📋 Please run the migration manually using one of these methods:\n');
        
        console.log('🔹 Method 1: Supabase Dashboard');
        console.log('   1. Go to your Supabase dashboard');
        console.log('   2. Navigate to the SQL Editor');
        console.log('   3. Copy and paste the contents of:');
        console.log('      supabase/migrations/20250619_create_credit_system.sql');
        console.log('   4. Click "Run" to execute the migration\n');
        
        console.log('🔹 Method 2: Supabase CLI');
        console.log('   1. Install Supabase CLI: npm install -g supabase');
        console.log('   2. Link your project: supabase link --project-ref osmhesmrvxusckjfxugr');
        console.log('   3. Run: supabase db push\n');
        
        console.log('🔹 Method 3: Copy SQL and run directly');
        console.log('   The migration file is ready at: supabase/migrations/20250619_create_credit_system.sql');
        console.log('   Copy its contents and execute in any PostgreSQL client\n');
        
        return false;
      }
      
      console.log('✅ Migration executed successfully!');
      return true;
      
    } catch (err) {
      console.error('❌ Migration execution failed:', err.message);
      console.log('\n📋 Manual Migration Required:');
      console.log('Please copy the contents of supabase/migrations/20250619_create_credit_system.sql');
      console.log('and execute it manually in your Supabase dashboard SQL Editor.\n');
      return false;
    }
    
    console.log('\n✅ All SQL statements executed successfully!');
    
    // Test the new functions
    console.log('\n🧪 Testing credit system functions...');
    
    // Test getting subscription tiers
    const { data: tiers, error: tiersError } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('is_active', true);
      
    if (tiersError) {
      console.error('❌ Error testing subscription tiers:', tiersError);
    } else {
      console.log(`✅ Found ${tiers.length} subscription tiers`);
      tiers.forEach(tier => {
        console.log(`   - ${tier.name}: ${tier.monthly_credits} credits/month ($${tier.price_cents / 100})`);
      });
    }
    
    // Test getting credit packages
    const { data: packages, error: packagesError } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('is_active', true);
      
    if (packagesError) {
      console.error('❌ Error testing credit packages:', packagesError);
    } else {
      console.log(`✅ Found ${packages.length} credit packages`);
      packages.forEach(pkg => {
        console.log(`   - ${pkg.name}: ${pkg.total_credits} credits ($${pkg.price_cents / 100})`);
      });
    }
    
    // Test credit functions
    console.log('\n🔧 Testing credit management functions...');
    
    // Create a test user credit record (if one doesn't exist)
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('⚠️  Could not list users for testing (this is normal in some setups)');
    } else if (users && users.length > 0) {
      const testUserId = users[0].id;
      console.log(`🔍 Testing with user: ${testUserId}`);
      
      // Test credit balance function
      const { data: balance, error: balanceError } = await supabase
        .rpc('get_user_credit_balance', { user_uuid: testUserId });
        
      if (balanceError) {
        console.log('⚠️  Credit balance function test failed (user may not have credits yet)');
      } else {
        console.log(`✅ Credit balance function works: ${balance} credits`);
      }
    }
    
    console.log('\n🎉 Credit System Migration Completed Successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Update your app to use the new credit system');
    console.log('2. Run user migration: SELECT migrate_users_to_credit_system();');
    console.log('3. Set up a cron job for monthly credits: SELECT grant_monthly_credits();');
    console.log('4. Test the credit system in your application');
    console.log('5. Update your subscription flow to use credit packages');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nYou may need to:');
    console.error('1. Check your database connection');
    console.error('2. Ensure you have proper permissions');
    console.error('3. Run the migration manually in your Supabase dashboard');
    process.exit(1);
  }
}

// Run user migration function
async function migrateExistingUsers() {
  console.log('\n👥 Migrating existing users to credit system...');
  
  try {
    const { data: migratedCount, error } = await supabase
      .rpc('migrate_users_to_credit_system');
      
    if (error) {
      console.error('❌ User migration failed:', error.message);
      return false;
    }
    
    console.log(`✅ Successfully migrated ${migratedCount} users to credit system`);
    return true;
  } catch (err) {
    console.error('❌ User migration error:', err.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔧 Credit-Based Subscription System Setup');
  console.log('=========================================\n');
  
  await runMigration();
  
  // Ask user if they want to migrate existing users
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('\n❓ Do you want to migrate existing users to the credit system? (y/N): ', async (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      await migrateExistingUsers();
    } else {
      console.log('⏭️  Skipping user migration. You can run it later with:');
      console.log('   SELECT migrate_users_to_credit_system();');
    }
    
    console.log('\n🎯 Credit system is ready to use!');
    console.log('📖 Check CREDIT-SYSTEM-MIGRATION-PLAN.md for implementation details');
    
    rl.close();
  });
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run the migration
main().catch(console.error);
