#!/bin/bash

# Script to run the voice recognition fix and rebuild the app

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting voice recognition fix process...${NC}"

# Check if the fix script exists
if [ ! -f "fix-voice-recognition.js" ]; then
  echo -e "${RED}Error: fix-voice-recognition.js not found!${NC}"
  exit 1
fi

# Run the fix script
echo -e "${YELLOW}Applying voice recognition fixes to ChatScreen.tsx...${NC}"
node fix-voice-recognition.js

# Check if the script executed successfully
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to apply voice recognition fixes!${NC}"
  exit 1
fi

echo -e "${GREEN}Voice recognition fixes applied successfully!${NC}"

# Clean the React Native cache
echo -e "${YELLOW}Cleaning React Native cache...${NC}"
npx react-native clean-project-auto

# Check if the clean command executed successfully
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Failed to clean React Native cache. Continuing anyway...${NC}"
fi

# Start the development server with cache reset
echo -e "${YELLOW}Starting development server with cache reset...${NC}"
echo -e "${YELLOW}This may take a few moments...${NC}"
npx react-native start --reset-cache &

# Store the process ID to kill it later
SERVER_PID=$!

# Give the server some time to start
sleep 5

echo -e "${GREEN}Voice recognition fix has been applied and the development server has been restarted.${NC}"
echo -e "${GREEN}To test the fix:${NC}"
echo -e "1. Open the app on your device or simulator"
echo -e "2. Navigate to the Chat screen"
echo -e "3. Tap the microphone button and speak"
echo -e "4. Verify that your speech is recognized and appears in the input field"
echo -e "5. Send the message to confirm the full flow works"

echo -e "${YELLOW}Press Ctrl+C when you're done testing to stop the development server.${NC}"

# Wait for user to press Ctrl+C
wait $SERVER_PID
