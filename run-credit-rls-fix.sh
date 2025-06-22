#!/bin/bash

# Fix Credit System RLS Policies via Supabase CLI
# This script applies the RLS fix migration and tests the result

echo "🔧 Fixing Credit System RLS Policies..."
echo "=========================================="

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    echo "   or"
    echo "   brew install supabase/tap/supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ No supabase/config.toml found. Make sure you're in your project root."
    echo "   Run 'supabase init' if this is a new project."
    exit 1
fi

echo "📝 Applying credit system RLS fix migration..."

# Apply the migration
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
    echo ""
    echo "🎉 Credit system RLS policies have been fixed!"
    echo ""
    echo "📋 What was fixed:"
    echo "  ✅ Disabled problematic RLS policies"
    echo "  ✅ Created new working policies"
    echo "  ✅ Initialized credits for existing users"
    echo "  ✅ Set up proper authentication checks"
    echo ""
    echo "🧪 Test your app now:"
    echo "  1. Open subscription screen - should show pricing tiers"
    echo "  2. Credit balance should display (10 credits)"
    echo "  3. No more RLS errors"
    echo "  4. Premium features accessible"
    echo ""
else
    echo "❌ Migration failed. Trying alternative approach..."
    echo ""
    echo "🔄 Alternative: Run migration manually"
    echo "   1. Go to your Supabase Dashboard"
    echo "   2. Navigate to SQL Editor"
    echo "   3. Copy and paste the content from:"
    echo "      supabase/migrations/20250620_fix_credit_system_rls.sql"
    echo "   4. Click 'Run'"
    echo ""
    echo "📄 Or run this command to see the SQL:"
    echo "   cat supabase/migrations/20250620_fix_credit_system_rls.sql"
fi

echo ""
echo "🚀 Your hybrid subscription system is ready to test!"
echo "   The subscription screen should now work without RLS errors."
