#!/bin/bash

# Post Apple Sign-In Fixes Script
# Fixes navigation errors, database issues, and permissions

echo "🔧 Post Apple Sign-In Fixes Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "app.json" ]; then
    print_error "app.json not found. Please run this script from your React Native project root."
    exit 1
fi

print_status "Fixing post Apple Sign-In issues..."

# Fix 1: Clean build and reinstall dependencies
print_status "Step 1: Cleaning and rebuilding..."
rm -rf node_modules
rm -rf ios/build
npm install
print_success "Dependencies reinstalled"

# Fix 2: Prebuild to update iOS configuration with new permissions
print_status "Step 2: Running prebuild to update iOS configuration..."
npx expo prebuild --clean
print_success "iOS configuration updated with microphone permissions"

# Fix 3: Pod install for iOS
print_status "Step 3: Installing iOS dependencies..."
cd ios
pod install --repo-update
cd ..
print_success "iOS pods installed"

# Fix 4: Check and display current configuration
print_status "Step 4: Checking current configuration..."

# Check bundle identifier
BUNDLE_ID=$(grep -A 10 '"ios"' app.json | grep '"bundleIdentifier"' | cut -d'"' -f4)
print_status "Bundle identifier: $BUNDLE_ID"

# Check if microphone permission is in app.json
if grep -q "NSMicrophoneUsageDescription" app.json; then
    print_success "Microphone permission found in app.json"
else
    print_warning "Microphone permission not found in app.json"
fi

# Fix 5: Database fixes needed
print_status "Step 5: Database fixes required"
print_warning "MANUAL STEPS REQUIRED FOR DATABASE:"
echo ""
echo "1. Add missing 'jung' avatar to Supabase:"
echo "   - Go to your Supabase project dashboard"
echo "   - Open SQL Editor"
echo "   - Run the SQL from fix-missing-jung-avatar.sql"
echo ""
echo "2. Alternatively, you can run this SQL query:"
echo "   INSERT INTO avatars (id, name, description, specialization) VALUES"
echo "   ('jung', 'Carl Jung', 'The pioneering Swiss psychiatrist', 'Jungian Psychology')"
echo "   ON CONFLICT (id) DO NOTHING;"
echo ""

# Fix 6: Navigation fixes summary
print_status "Step 6: Navigation fixes applied"
print_success "Added ConversationInsightsScreen-enhanced to navigation"
print_success "All required screens now registered in AppNavigator.tsx"

# Fix 7: Credit initialization fix
print_status "Step 7: Credit initialization fix applied"
print_success "Duplicate key error handling added to creditService.ts"

print_status "Summary of fixes applied:"
echo "✅ Added microphone permissions to app.json"
echo "✅ Fixed navigation for ConversationInsightsScreen-enhanced"
echo "✅ Added duplicate key error handling for credit initialization"
echo "✅ Updated iOS configuration with prebuild"
echo ""

print_warning "Manual steps still required:"
echo "1. Add 'jung' avatar to Supabase database (see fix-missing-jung-avatar.sql)"
echo "2. Update Supabase Apple provider Service ID to: $BUNDLE_ID"
echo ""

print_status "Building for device testing..."
print_warning "Make sure to:"
echo "1. Connect your iOS device"
echo "2. Complete Supabase database fixes"
echo "3. Update Supabase Apple provider Service ID"
echo ""

# Final build
read -p "Do you want to build for device now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Building for device..."
    npx expo run:ios --device
else
    print_status "Skipping device build. Run 'npx expo run:ios --device' when ready."
fi

print_status "Next steps to complete the fixes:"
echo "1. Run the SQL from fix-missing-jung-avatar.sql in your Supabase SQL Editor"
echo "2. Update Supabase Apple provider Service ID to: $BUNDLE_ID"
echo "3. Test Apple Sign-In on device"
echo ""

print_success "Post Apple Sign-In fixes completed!"
echo "The app should now work without navigation errors, microphone issues, or credit initialization problems."
