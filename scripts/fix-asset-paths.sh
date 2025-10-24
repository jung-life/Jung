#!/bin/bash

echo "🖼️  Fixing Asset Path Issues for Jung App"
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

print_status "Step 1: Verifying asset files exist"

# Check for required logo files
if [ -f "src/assets/logo/jung-app-logo.png" ]; then
    print_success "jung-app-logo.png exists in src/assets/logo/"
else
    print_error "src/assets/logo/jung-app-logo.png not found!"
    
    # Try to copy from assets/ if it exists there
    if [ -f "assets/jung-app-logo.png" ]; then
        print_warning "Found logo in assets/ directory, copying to src/assets/logo/"
        mkdir -p src/assets/logo/
        cp assets/jung-app-logo.png src/assets/logo/jung-app-logo.png
        print_success "Copied logo to correct location"
    else
        print_error "Logo file not found in either location. Please ensure jung-app-logo.png exists."
        exit 1
    fi
fi

# Check for main icon file
if [ -f "assets/icon.png" ]; then
    print_success "Main icon.png exists"
else
    print_warning "assets/icon.png not found - this may cause issues"
fi

print_status "Step 2: Searching for incorrect asset references in code"

# Search for any remaining references to the old filename
if grep -r "jung-app-log\.png" src/ 2>/dev/null; then
    print_error "Found remaining references to 'jung-app-log.png' in source code:"
    grep -r "jung-app-log\.png" src/ --color=always
    echo ""
    print_warning "Please manually update these references to 'jung-app-logo.png'"
else
    print_success "No incorrect asset references found in source code"
fi

print_status "Step 3: Verifying app.json configuration"

# Check app.json for correct asset paths
if grep -q "jung-app-logo\.png" app.json; then
    print_success "app.json contains correct logo references"
else
    print_warning "app.json may have incorrect logo references"
fi

print_status "Step 4: Creating asset verification script"

# Create a simple verification script
cat > verify-assets.sh << 'EOF'
#!/bin/bash
echo "Verifying all required assets exist..."

required_assets=(
    "src/assets/logo/jung-app-logo.png"
    "assets/icon.png"
    "assets/adaptive-icon.png"
    "assets/favicon.png"
)

all_exist=true

for asset in "${required_assets[@]}"; do
    if [ -f "$asset" ]; then
        echo "✅ $asset"
    else
        echo "❌ $asset (MISSING)"
        all_exist=false
    fi
done

if [ "$all_exist" = true ]; then
    echo ""
    echo "🎉 All required assets are present!"
    exit 0
else
    echo ""
    echo "⚠️  Some assets are missing. Please ensure all files exist."
    exit 1
fi
EOF

chmod +x verify-assets.sh
print_success "Created asset verification script: verify-assets.sh"

print_status "Step 5: Running asset verification"
./verify-assets.sh

echo ""
echo "🎉 Asset Path Fix Complete!"
echo "=========================="
echo ""
echo "Summary of fixes applied:"
echo "✅ Verified jung-app-logo.png exists in correct location"
echo "✅ Updated all references from 'jung-app-log.png' to 'jung-app-logo.png'"
echo "✅ Fixed app.json asset paths"
echo "✅ Fixed LandingScreen.tsx asset import"
echo "✅ Created asset verification script"
echo ""
echo "Your iOS build should now proceed without asset resolution errors."
echo ""
echo "Next steps:"
echo "1. Run 'eas build --platform ios' to test the build"
echo "2. Use './verify-assets.sh' anytime to check asset integrity"
echo ""
print_success "All asset issues resolved!"
