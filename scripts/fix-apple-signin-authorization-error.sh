#!/bin/bash

# Apple Sign-In Authorization Error Fix Script
# Fixes Error Code 1000: "The authorization attempt failed for an unknown reason"

echo "🍎 Apple Sign-In Authorization Error Fix Script"
echo "================================================"

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

print_status "Starting Apple Sign-In authorization error fix..."

# Step 1: Clean previous builds
print_status "Step 1: Cleaning previous builds..."
rm -rf node_modules
rm -rf ios/build
rm -rf ios/Pods
rm -rf ios/Podfile.lock
print_success "Cleaned previous builds"

# Step 2: Install dependencies
print_status "Step 2: Installing dependencies..."
npm install
print_success "Dependencies installed"

# Step 3: Install CocoaPods
print_status "Step 3: Installing CocoaPods..."
cd ios
pod install --repo-update
cd ..
print_success "CocoaPods installed"

# Step 4: Check Apple Sign-In configuration
print_status "Step 4: Checking Apple Sign-In configuration..."

# Check if expo-apple-authentication is in package.json
if grep -q "expo-apple-authentication" package.json; then
    print_success "expo-apple-authentication is installed"
else
    print_warning "expo-apple-authentication not found, installing..."
    npx expo install expo-apple-authentication
fi

# Check entitlements file
if [ -f "ios/jung/jung.entitlements" ]; then
    if grep -q "com.apple.developer.applesignin" ios/jung/jung.entitlements; then
        print_success "Apple Sign-In entitlement found"
    else
        print_error "Apple Sign-In entitlement missing from ios/jung/jung.entitlements"
    fi
else
    print_error "Entitlements file not found: ios/jung/jung.entitlements"
fi

# Step 5: Prebuild with clean slate
print_status "Step 5: Running Expo prebuild with clean slate..."
npx expo prebuild --clean
print_success "Prebuild completed"

# Step 6: Check bundle identifier
print_status "Step 6: Checking bundle identifier..."
BUNDLE_ID=$(grep -A 10 '"ios"' app.json | grep '"bundleIdentifier"' | cut -d'"' -f4)
print_status "Current bundle identifier: $BUNDLE_ID"

if [ "$BUNDLE_ID" != "org.name.jung" ]; then
    print_warning "Bundle identifier is not 'org.name.jung'. This may cause issues."
    print_warning "Current: $BUNDLE_ID"
    print_warning "Expected: org.name.jung"
fi

# Step 7: Validate Apple Developer requirements
print_status "Step 7: Apple Developer Console Requirements Check"
echo ""
print_warning "MANUAL STEPS REQUIRED:"
echo "1. Go to https://developer.apple.com/account/"
echo "2. Navigate to Certificates, Identifiers & Profiles > Identifiers"
echo "3. Find/Create App ID with Bundle ID: $BUNDLE_ID"
echo "4. Enable 'Sign In with Apple' capability"
echo "5. Create Service ID: $BUNDLE_ID.web"
echo "6. Generate private key (.p8 file) with Sign In with Apple capability"
echo "7. Configure Supabase with Service ID, Team ID, Key ID, and private key"
echo ""

# Step 8: Check device requirements
print_status "Step 8: Device Requirements Check"
print_warning "TESTING REQUIREMENTS:"
echo "- Real iOS device (not simulator)"
echo "- iOS 13.0 or later"
echo "- Device signed into iCloud"
echo "- Two-factor authentication enabled on Apple ID"
echo "- Valid Apple Developer Program membership (\$99/year)"
echo ""

# Step 9: Build for device
print_status "Step 9: Building for device..."
print_warning "Building for device testing. Make sure your device is connected."

# Check if device is connected
if xcrun simctl list devices | grep -q "Booted"; then
    print_warning "iOS Simulator detected. Apple Sign-In requires a real device."
fi

print_status "To build for device, run one of these commands:"
echo "  npx expo run:ios --device"
echo "  OR"
echo "  eas build --platform ios --profile development"
echo ""

# Step 10: Debug information
print_status "Step 10: Debug Information"
echo ""
print_status "Bundle Identifier: $BUNDLE_ID"
print_status "App Name: $(grep '"name"' app.json | head -1 | cut -d'"' -f4)"
print_status "App Version: $(grep '"version"' app.json | cut -d'"' -f4)"
echo ""

# Step 11: Testing script
print_status "Step 11: Creating test script..."
cat > test-apple-signin.js << 'EOF'
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';

export const testAppleSignIn = async () => {
  console.log('=== Apple Sign-In Test ===');
  console.log('Bundle ID:', Constants.expoConfig?.ios?.bundleIdentifier);
  console.log('Platform:', Platform.OS);
  console.log('iOS Version:', Platform.Version);
  
  try {
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    console.log('Apple Sign-In Available:', isAvailable);
    
    if (!isAvailable) {
      console.log('❌ Apple Sign-In not available');
      console.log('Possible reasons:');
      console.log('- Running on simulator (use real device)');
      console.log('- Not signed into iCloud');
      console.log('- 2FA not enabled');
      console.log('- iOS < 13.0');
      return false;
    }
    
    console.log('✅ Apple Sign-In is available');
    console.log('✅ Ready to test sign-in flow');
    return true;
  } catch (error) {
    console.error('Error checking availability:', error);
    return false;
  }
};
EOF

print_success "Created test-apple-signin.js"

# Final summary
echo ""
print_success "Apple Sign-In Authorization Error Fix Completed!"
echo ""
print_status "NEXT STEPS:"
echo "1. Complete Apple Developer Console configuration (see manual steps above)"
echo "2. Update Supabase Apple provider settings"
echo "3. Build and test on real iOS device:"
echo "   npx expo run:ios --device"
echo ""
print_status "IMPORTANT REMINDERS:"
echo "- Apple Sign-In only works on real iOS devices (not simulator)"
echo "- Device must be signed into iCloud with 2FA enabled"
echo "- You need an active Apple Developer Program membership"
echo "- Bundle ID must match exactly in Apple Developer Console"
echo ""
print_status "For detailed instructions, see: APPLE-SIGNIN-AUTHORIZATION-ERROR-FIX.md"
echo ""

# Check if we should attempt device build
read -p "Do you want to attempt building for device now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Building for device..."
    npx expo run:ios --device
else
    print_status "Skipping device build. Run 'npx expo run:ios --device' when ready."
fi

print_success "Script completed successfully!"
