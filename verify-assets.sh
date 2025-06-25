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
