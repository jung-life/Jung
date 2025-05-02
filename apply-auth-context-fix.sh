#!/bin/bash

# Script to apply the AuthContext fix for the Jung App
# This fix synchronizes the user state between AuthContext and useAuthStore

echo "Applying AuthContext fix for Jung App"
echo "===================================="

# Check if the fix file exists
if [ ! -f "src/contexts/AuthContext-fix.tsx" ]; then
  echo "Error: src/contexts/AuthContext-fix.tsx not found!"
  echo "Please make sure the fix file exists before running this script."
  exit 1
fi

# Create a backup of the original file
echo "Creating backup of original AuthContext.tsx..."
BACKUP_FILE="src/contexts/AuthContext.tsx.bak.$(date +%Y%m%d%H%M%S)"
cp src/contexts/AuthContext.tsx "$BACKUP_FILE"
echo "Backup created at $BACKUP_FILE"

# Apply the fix
echo "Applying the fix..."
cp src/contexts/AuthContext-fix.tsx src/contexts/AuthContext.tsx
echo "Fix applied successfully!"

# Make the script executable
chmod +x src/contexts/AuthContext.tsx

echo ""
echo "===================================="
echo "Fix has been applied successfully!"
echo ""
echo "This fix synchronizes the user state between AuthContext and useAuthStore,"
echo "which should resolve the 'No authenticated user found in store' error in"
echo "the ConversationHistoryScreen."
echo ""
echo "To test the fix:"
echo "1. Run the app with: npm start"
echo "2. Log in to the app"
echo "3. Navigate to the Conversation History screen"
echo "4. Verify that the conversation history loads correctly"
echo ""
echo "If you encounter any issues, you can restore the original file from the backup:"
echo "cp $BACKUP_FILE src/contexts/AuthContext.tsx"
echo ""
