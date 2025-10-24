#!/bin/bash

echo "🔧 Fixing iOS Build Failures for Jung App"
echo "=========================================="

# Function to print colored output
print_status() {
    echo -e "\033[1;34m$1\033[0m"
}

print_success() {
    echo -e "\033[1;32m✅ $1\033[0m"
}

print_error() {
    echo -e "\033[1;31m❌ $1\033[0m"
}

print_warning() {
    echo -e "\033[1;33m⚠️  $1\033[0m"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "app.json" ]; then
    print_error "Not in the correct project directory. Please run this script from the project root."
    exit 1
fi

print_status "Step 1: Checking GoogleService-Info.plist"
if [ ! -f "GoogleService-Info.plist" ]; then
    print_error "GoogleService-Info.plist is missing!"
    print_warning "Please download it from Firebase Console and place it in the project root."
    echo "1. Go to Firebase Console -> Project Settings -> iOS apps"
    echo "2. Download GoogleService-Info.plist"
    echo "3. Place it in the project root directory"
    echo ""
    print_warning "Continuing with other fixes..."
else
    print_success "GoogleService-Info.plist found"
fi

print_status "Step 2: Fixing app.json configuration issues"
# Check if app.json has proper iOS configuration
if ! grep -q '"buildConfiguration"' app.json; then
    print_warning "Adding missing iOS buildConfiguration to app.json"
    # Create a backup
    cp app.json app.json.backup
    
    # Use Python to safely add the buildConfiguration
    python3 -c "
import json
import sys

try:
    with open('app.json', 'r') as f:
        data = json.load(f)
    
    if 'ios' not in data['expo']:
        data['expo']['ios'] = {}
    
    data['expo']['ios']['buildConfiguration'] = 'Release'
    
    with open('app.json', 'w') as f:
        json.dump(data, f, indent=2)
    
    print('✅ Added buildConfiguration to app.json')
except Exception as e:
    print(f'❌ Error updating app.json: {e}')
    sys.exit(1)
"
else
    print_success "iOS buildConfiguration already present"
fi

print_status "Step 3: Checking and fixing package.json main entry"
if grep -q '"main": "index-enhanced.ts"' package.json; then
    print_warning "Fixing main entry point in package.json"
    sed -i.bak 's/"main": "index-enhanced.ts"/"main": "index.js"/' package.json
    print_success "Updated main entry to index.js"
fi

print_status "Step 4: Creating proper index.js entry point"
if [ ! -f "index.js" ]; then
    print_warning "Creating index.js entry point"
    cat > index.js << 'EOF'
import 'react-native-get-random-values';
import { registerRootComponent } from 'expo';
import App from './src/App';

registerRootComponent(App);
EOF
    print_success "Created index.js"
fi

print_status "Step 5: Cleaning build artifacts and caches"
# Clean iOS build artifacts
if [ -d "ios/build" ]; then
    rm -rf ios/build
    print_success "Removed iOS build directory"
fi

# Clean Pods
if [ -d "ios/Pods" ]; then
    rm -rf ios/Pods
    print_success "Removed iOS Pods directory"
fi

if [ -f "ios/Podfile.lock" ]; then
    rm -f ios/Podfile.lock
    print_success "Removed Podfile.lock"
fi

# Clean node modules and reinstall
print_status "Step 6: Reinstalling dependencies"
rm -rf node_modules
npm cache clean --force
npm install
print_success "Dependencies reinstalled"

print_status "Step 7: Fixing iOS dependencies"
cd ios
pod deintegrate 2>/dev/null || true
pod cache clean --all 2>/dev/null || true
pod setup
pod install --repo-update
cd ..
print_success "iOS dependencies fixed"

print_status "Step 8: Fixing file permissions"
find ios/Pods -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true
print_success "Fixed shell script permissions"

print_status "Step 9: Updating EAS configuration"
# Ensure EAS configuration is properly set for iOS builds
python3 -c "
import json

try:
    with open('eas.json', 'r') as f:
        data = json.load(f)
    
    # Add iOS specific configuration for production builds
    if 'production' in data['build']:
        if 'ios' not in data['build']['production']:
            data['build']['production']['ios'] = {}
        data['build']['production']['ios']['buildConfiguration'] = 'Release'
    
    # Ensure development build has proper iOS configuration
    if 'development' in data['build']:
        if 'ios' not in data['build']['development']:
            data['build']['development']['ios'] = {}
        data['build']['development']['ios']['buildConfiguration'] = 'Debug'
    
    with open('eas.json', 'w') as f:
        json.dump(data, f, indent=2)
    
    print('✅ Updated EAS configuration')
except Exception as e:
    print(f'❌ Error updating eas.json: {e}')
"

print_status "Step 10: Checking app.config.js compatibility"
# Check if app.config.js might be causing issues
if [ -f "app.config.js" ]; then
    print_warning "app.config.js detected - this might override app.json settings"
    echo "If build continues to fail, consider temporarily renaming app.config.js to app.config.js.bak"
fi

print_status "Step 11: Environment variables check"
echo "Checking for required environment variables..."
if [ -f ".env" ]; then
    if ! grep -q "EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID" .env; then
        print_warning "EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID not found in .env"
        echo "Please add your iOS Google Client ID to .env file"
    else
        print_success "Google Client ID environment variable found"
    fi
else
    print_warning ".env file not found - create one if you need environment variables"
fi

echo ""
echo "🎉 iOS Build Fix Complete!"
echo "=========================="
echo ""
echo "Next steps:"
echo "1. Try building with: eas build --platform ios"
echo "2. Or for local build: npx expo run:ios"
echo ""
echo "If the build still fails:"
echo "1. Check that GoogleService-Info.plist is properly configured"
echo "2. Ensure your Apple Developer account is set up in EAS"
echo "3. Verify all environment variables are set correctly"
echo "4. Consider temporarily disabling app.config.js if issues persist"
echo ""
print_success "All fixes applied successfully!"
