#!/usr/bin/env node

/**
 * Initialize User Credits - Test Script
 * This script ensures the current user has proper credit records
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

async function initializeCurrentUser() {
  console.log('🔍 Checking for users without credit records...');
  
  try {
    // Get all users from auth.users who don't have credit records
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message);
      return;
    }
    
    console.log(`📋 Found ${users.users.length} total users`);
    
    for (const user of users.users) {
      console.log(`\n👤 Checking user: ${user.email || user.id}`);
      
      // Check if user has credit record
      const { data: creditRecord, error: creditError } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (creditError && creditError.code === 'PGRST116') {
        // No credit record found - create one
        console.log('   ⚠️  No credit record found, creating...');
        
        const { error: insertError } = await supabase
          .from('user_credits')
          .insert({
            user_id: user.id,
            current_balance: 10,
            total_earned: 10,
            total_spent: 0,
            total_purchased: 0,
            subscription_tier_id: 'free',
          });
        
        if (insertError) {
          console.log('   ❌ Error creating credit record:', insertError.message);
        } else {
          console.log('   ✅ Credit record created with 10 welcome credits');
          
          // Log the welcome transaction
          await supabase
            .from('credit_transactions')
            .insert({
              user_id: user.id,
              transaction_type: 'granted',
              amount: 10,
              balance_before: 0,
              balance_after: 10,
              source_type: 'migration',
              source_id: 'free',
              description: 'Welcome credits for existing user',
            });
          
          console.log('   ✅ Welcome transaction logged');
        }
      } else if (creditError) {
        console.log('   ❌ Error checking credit record:', creditError.message);
      } else {
        console.log(`   ✅ Credit record exists: ${creditRecord.current_balance} credits`);
      }
    }
    
    console.log('\n🎉 User credit initialization complete!');
    
  } catch (error) {
    console.error('❌ Error in initialization:', error.message);
  }
}

// Run the initialization
initializeCurrentUser();
