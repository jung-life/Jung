#!/bin/bash

echo "🧹 Clearing Metro bundler cache and restarting development server..."

# Kill any existing Metro processes
pkill -f "expo start\|react-native start\|metro"

# Clear Metro cache
npx expo start --clear

echo "✅ Metro cache cleared and development server restarted!"
echo "🔄 Please try navigating to the ConversationInsightsScreen-enhanced again."
