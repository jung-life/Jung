#!/bin/bash

echo "🔧 Jung App - Fixing Credit Spending Function"
echo "============================================="

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the Jung app root directory."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create one with your Supabase credentials."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install @supabase/supabase-js dotenv

echo "🚀 Running credit spending function fix..."
node fix-credit-spending.js

echo ""
echo "✅ Credit spending fix completed!"
echo ""
echo "📋 Summary:"
echo "   • Fixed ambiguous column reference in spend_credits function"
echo "   • Fixed variable naming conflict in add_credits function"
echo "   • Both functions now use explicit table aliases"
echo ""
echo "🎯 To test the fix:"
echo "   1. Try sending a message in the app"
echo "   2. Check that credits are properly deducted"
echo "   3. Monitor the console for 'Credit spent successfully' messages"
echo ""
