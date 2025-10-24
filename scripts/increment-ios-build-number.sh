#!/bin/bash

echo "🔢 Incrementing iOS Build Number"
echo "================================"

# Check if we're in the right directory
if [ ! -f "app.json" ]; then
    echo "❌ app.json not found. Please run this script from the project root."
    exit 1
fi

# Extract current build number using grep and sed
current_build=$(grep '"buildNumber"' app.json | sed 's/.*"buildNumber": "\([^"]*\)".*/\1/')

if [ -z "$current_build" ]; then
    echo "❌ No buildNumber found in app.json"
    echo "Adding buildNumber: \"1\" to app.json..."
    
    # Add buildNumber if it doesn't exist
    python3 -c "
import json
with open('app.json', 'r') as f:
    data = json.load(f)

if 'ios' not in data['expo']:
    data['expo']['ios'] = {}

data['expo']['ios']['buildNumber'] = '1'

with open('app.json', 'w') as f:
    json.dump(data, f, indent=2)

print('✅ Added buildNumber: \"1\" to app.json')
"
else
    # Increment the build number
    new_build=$((current_build + 1))
    
    echo "Current build number: $current_build"
    echo "New build number: $new_build"
    
    # Update the build number in app.json
    python3 -c "
import json
with open('app.json', 'r') as f:
    data = json.load(f)

data['expo']['ios']['buildNumber'] = '$new_build'

with open('app.json', 'w') as f:
    json.dump(data, f, indent=2)

print('✅ Updated build number from $current_build to $new_build')
"
fi

echo ""
echo "🎉 Build number updated successfully!"
echo "You can now run: eas build --platform ios"
