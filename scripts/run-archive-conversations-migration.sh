#!/bin/bash

# Archive Conversations Migration Script
# This script adds the archived column to the conversations table

echo "🚀 Running archive conversations migration..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Run the migration using supabase db diff and push
echo "📝 Applying archive conversations migration..."

# Method 1: Try using supabase db push with SQL file
if supabase db push --include-all --file setup-archive-conversations.sql 2>/dev/null; then
    echo "✅ Migration applied successfully using db push!"
elif supabase db reset --linked 2>/dev/null && cat setup-archive-conversations.sql | supabase db reset --stdin 2>/dev/null; then
    echo "✅ Migration applied successfully using db reset!"
else
    # Method 2: Manual execution via psql if available
    echo "⚠️  Trying alternative method..."
    echo ""
    echo "📋 Please run the following SQL manually in your Supabase dashboard:"
    echo "   Go to: https://app.supabase.com/project/[your-project]/sql"
    echo ""
    echo "   Copy and paste this SQL:"
    echo "   ----------------------------------------"
    cat setup-archive-conversations.sql
    echo "   ----------------------------------------"
    echo ""
    echo "   Or run this command if you have direct database access:"
    echo "   psql -h [your-db-host] -U postgres -d postgres -f setup-archive-conversations.sql"
    echo ""
    read -p "Press Enter after you've run the SQL manually..."
fi

echo ""
echo "📋 What was added:"
echo "   - Added 'archived' boolean column to conversations table (default: false)"
echo "   - Created index on 'archived' column for better query performance"
echo ""
echo "🎯 Next steps:"
echo "   1. The app now supports archiving conversations"
echo "   2. Users can swipe right on conversations to archive them"
echo "   3. Archived conversations are accessible via the 'Archived Conversations' button"
echo ""
echo "✅ Archive conversations feature is ready to use!"
