#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Applying subscription database migration...\n');

// Read the migration file
const migrationPath = 'supabase/migrations/20250609_create_user_subscriptions_table.sql';

if (!fs.existsSync(migrationPath)) {
  console.error('❌ Migration file not found:', migrationPath);
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('📋 Migration Contents:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(migrationSQL);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('\n📖 To apply this migration to your Supabase database:');
console.log('');
console.log('1. Open your Supabase Dashboard');
console.log('2. Go to the SQL Editor');
console.log('3. Copy and paste the migration SQL above');
console.log('4. Click "RUN" to execute the migration');
console.log('');
console.log('Or if you have Supabase CLI installed:');
console.log('   supabase db push');
console.log('');

console.log('✅ This migration will create:');
console.log('   • user_subscriptions table');
console.log('   • Indexes for efficient queries');
console.log('   • Row Level Security policies');
console.log('   • Helper functions for subscription status');
console.log('   • Triggers for automatic timestamp updates');

console.log('\n🔒 Security Features:');
console.log('   • RLS enabled for user data protection');
console.log('   • Users can only see their own subscriptions');
console.log('   • Service role has full access for backend operations');

console.log('\n🎯 Ready for production subscription tracking!');
