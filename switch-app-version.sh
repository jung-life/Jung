#!/bin/bash

# Script to switch between regular and enhanced versions of the Jung app

# Function to display usage information
show_usage() {
  echo "Usage: $0 [regular|enhanced]"
  echo "  regular   - Switch to the regular version of the app"
  echo "  enhanced  - Switch to the enhanced version of the app with improved authentication"
  exit 1
}

# Check if an argument was provided
if [ $# -ne 1 ]; then
  show_usage
fi

# Get the current directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check which version to switch to
case "$1" in
  regular)
    echo "Switching to regular version of the Jung app..."
    # Update package.json to use the regular entry point
    sed -i '' 's/"main": ".*"/"main": "index.ts"/' "$DIR/package.json"
    echo "Done! The app will now use the regular version."
    ;;
  enhanced)
    echo "Switching to enhanced version of the Jung app with improved authentication..."
    # Update package.json to use the enhanced entry point
    sed -i '' 's/"main": ".*"/"main": "index-enhanced.ts"/' "$DIR/package.json"
    echo "Done! The app will now use the enhanced version with improved authentication."
    ;;
  *)
    echo "Error: Invalid option '$1'"
    show_usage
    ;;
esac

echo ""
echo "To apply the changes, restart the app with:"
echo "  npm start"
echo "or"
echo "  expo start"
