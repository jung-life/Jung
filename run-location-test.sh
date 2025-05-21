#!/bin/bash

# Script to run the location permissions test

echo "Running location permissions test..."

# Use npx to run the test file with babel-node for ES6 module support
npx babel-node test-location-permissions.js

echo "Test completed!"
