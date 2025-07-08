#!/bin/bash

echo "🧹 Clearing Metro cache and restarting development server..."

# Kill any existing Metro processes
echo "Killing existing Metro processes..."
pkill -f "metro" || true
pkill -f "react-native" || true

# Clear Metro cache
echo "Clearing Metro cache..."
npx react-native start --reset-cache &

# Wait a moment for Metro to start
sleep 3

echo "✅ Metro cache cleared and server restarted!"
echo "📱 You can now reload your app (R+R or Cmd+R in simulator)"
echo "💡 If you still see errors, try manually reloading the app in the simulator"
