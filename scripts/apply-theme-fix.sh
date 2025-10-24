#!/bin/bash

# Script to apply the theme fix to the Jung app

echo "Applying theme fix to Jung app..."

# Check if the ThemeContext-fix.tsx file exists
if [ ! -f "src/contexts/ThemeContext-fix.tsx" ]; then
  echo "Error: ThemeContext-fix.tsx file not found!"
  exit 1
fi

# Backup the original ThemeContext.tsx file
echo "Creating backup of original ThemeContext.tsx..."
cp src/contexts/ThemeContext.tsx src/contexts/ThemeContext.tsx.bak

# Replace the original file with the fixed version
echo "Replacing ThemeContext.tsx with fixed version..."
cp src/contexts/ThemeContext-fix.tsx src/contexts/ThemeContext.tsx

echo "Theme fix applied successfully!"
echo "A backup of the original file has been saved as src/contexts/ThemeContext.tsx.bak"
echo ""
echo "The fix includes:"
echo "1. Using useColorScheme hook to properly detect system theme changes"
echo "2. Improved theme state management and persistence"
echo "3. Better logging for debugging theme-related issues"
echo ""
echo "To test the fix:"
echo "1. Go to the Account screen"
echo "2. Try switching between Light, Dark, and System themes"
echo "3. Restart the app to verify that your theme preference is saved"
