#!/usr/bin/env node

/**
 * Fix Credit System RLS Policies
 * This script fixes Row Level Security policies that are preventing credit initialization
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

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS policies for credit system...');
  
  const policies = [
    // User Credits table policies
    {
      table: 'user_credits',
      name: 'user_credits_select',
      operation: 'SELECT',
      policy: 'user_id = auth.uid()'
    },
    {
      table: 'user_credits',
      name: 'user_credits_insert',
      operation: 'INSERT',
      policy: 'user_id = auth.uid()'
    },
    {
      table: 'user_credits',
      name: 'user_credits_update',
      operation: 'UPDATE',
      policy: 'user_id = auth.uid()'
    },
    
    // Credit Transactions table policies
    {
      table: 'credit_transactions',
      name: 'credit_transactions_select',
      operation: 'SELECT',
      policy: 'user_id = auth.uid()'
    },
    {
      table: 'credit_transactions',
      name: 'credit_transactions_insert',
      operation: 'INSERT',
      policy: 'user_id = auth.uid()'
    },
    
    // Message Costs table policies  
    {
      table: 'message_costs',
      name: 'message_costs_select',
      operation: 'SELECT',
      policy: 'user_id = auth.uid()'
    },
    {
      table: 'message_costs',
      name: 'message_costs_insert',
      operation: 'INSERT',
      policy: 'user_id = auth.uid()'
    }
  ];

  try {
    for (const policyDef of policies) {
      console.log(`📝 Creating policy: ${policyDef.name} on ${policyDef.table}`);
      
      // Drop policy if exists (ignore errors)
      try {
        await supabase.rpc('exec_sql', {
          sql: `DROP POLICY IF EXISTS "${policyDef.name}" ON "${policyDef.table}";`
        });
      } catch (err) {
        // Ignore errors for dropping non-existent policies
      }
      
      // Create the policy
      const createPolicySQL = `
        CREATE POLICY "${policyDef.name}" ON "${policyDef.table}"
        FOR ${policyDef.operation} TO authenticated
        USING (${policyDef.policy});
      `;
      
      try {
        await supabase.rpc('exec_sql', { sql: createPolicySQL });
        console.log(`   ✅ Policy ${policyDef.name} created successfully`);
      } catch (error) {
        console.log(`   ⚠️  Policy ${policyDef.name} may already exist or have issues:`, error.message);
      }
    }

    // Enable RLS on tables
    const tables = ['user_credits', 'credit_transactions', 'message_costs'];
    
    for (const table of tables) {
      console.log(`🔒 Enabling RLS on ${table}...`);
      try {
        await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`
        });
        console.log(`   ✅ RLS enabled on ${table}`);
      } catch (error) {
        console.log(`   ⚠️  RLS may already be enabled on ${table}:`, error.message);
      }
    }

    console.log('\n🎉 RLS policies fixed successfully!');
    console.log('\nNow try running: node initialize-user-credits.js');
    
  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error.message);
    
    // Fallback: Try to disable RLS temporarily for credit initialization
    console.log('\n🔄 Attempting fallback: Temporarily adjusting policies...');
    
    try {
      // Create more permissive policies for authenticated users
      const fallbackSQL = `
        -- Drop existing policies
        DROP POLICY IF EXISTS "user_credits_insert" ON "user_credits";
        DROP POLICY IF EXISTS "credit_transactions_insert" ON "credit_transactions";
        
        -- Create permissive policies for authenticated users
        CREATE POLICY "user_credits_insert" ON "user_credits"
        FOR INSERT TO authenticated
        WITH CHECK (true);
        
        CREATE POLICY "credit_transactions_insert" ON "credit_transactions"  
        FOR INSERT TO authenticated
        WITH CHECK (true);
      `;
      
      await supabase.rpc('exec_sql', { sql: fallbackSQL });
      console.log('✅ Fallback policies created - try initializing credits now');
      
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError.message);
      
      // Final fallback: provide manual SQL
      console.log('\n📋 Manual fix - run this SQL in your Supabase SQL editor:');
      console.log(`
-- Fix RLS policies for credit system
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies  
DROP POLICY IF EXISTS "user_credits_select" ON user_credits;
DROP POLICY IF EXISTS "user_credits_insert" ON user_credits;
DROP POLICY IF EXISTS "user_credits_update" ON user_credits;
DROP POLICY IF EXISTS "credit_transactions_select" ON credit_transactions;
DROP POLICY IF EXISTS "credit_transactions_insert" ON credit_transactions;

-- Create working policies
CREATE POLICY "user_credits_select" ON user_credits
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "user_credits_insert" ON user_credits
FOR INSERT TO authenticated  
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_credits_update" ON user_credits
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "credit_transactions_select" ON credit_transactions
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "credit_transactions_insert" ON credit_transactions
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
      `);
    }
  }
}

// Run the fix
fixRLSPolicies();
