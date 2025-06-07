#!/bin/bash

# Process the existing icon file and generate all required sizes
SOURCE_ICON="icon_1024 1024.png"
ICON_PATH="ios/Runner/Assets.xcassets/AppIcon.appiconset"
MARKETING_ICON="Icon-App-1024x1024@1x.png"

echo "Creating app icon directory if it doesn't exist..."
mkdir -p "$ICON_PATH"

# Check if source icon exists
if [ -f "$SOURCE_ICON" ]; then
    echo "Found source icon: $SOURCE_ICON"
    
    # Copy and rename the 1024x1024 icon
    cp "$SOURCE_ICON" "$ICON_PATH/$MARKETING_ICON"
    echo "✓ Copied 1024x1024 marketing icon"
    
    # Generate other required sizes using sips (built-in macOS tool)
    declare -a sizes=("20x20@2x:40" "20x20@3x:60" "29x29@1x:29" "29x29@2x:58" "29x29@3x:87" "40x40@2x:80" "40x40@3x:120" "60x60@2x:120" "60x60@3x:180")
    
    for size_info in "${sizes[@]}"; do
        IFS=':' read -r name pixels <<< "$size_info"
        output_file="$ICON_PATH/Icon-App-$name.png"
        sips -z $pixels $pixels "$SOURCE_ICON" --out "$output_file" > /dev/null 2>&1
        echo "✓ Generated Icon-App-$name.png"
    done
    
    echo ""
    echo "✅ All app icons generated successfully!"
    echo "You can now rebuild and resubmit your app through Fastlane."
else
    echo "❌ Error: Could not find '$SOURCE_ICON' in current directory"
    echo "Please make sure the file exists and run this script from the correct location."
fi
