#!/usr/bin/env node

/**
 * Script to clear authentication cache and invalid sessions
 * Run this script when experiencing refresh token errors
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Clearing authentication cache...');

// Clear Metro cache
console.log('📦 Clearing Metro cache...');
try {
  const { execSync } = require('child_process');
  execSync('npx expo r -c', { stdio: 'inherit' });
  console.log('✅ Metro cache cleared');
} catch (error) {
  console.warn('⚠️  Could not clear Metro cache:', error.message);
}

// Clear node_modules cache for auth-related packages
console.log('🗂️  Clearing node_modules auth cache...');
const authPackages = [
  'node_modules/@supabase',
  'node_modules/expo-secure-store',
  'node_modules/@react-native-async-storage',
];

authPackages.forEach(packagePath => {
  try {
    if (fs.existsSync(packagePath)) {
      fs.rmSync(packagePath, { recursive: true, force: true });
      console.log(`✅ Cleared ${packagePath}`);
    }
  } catch (error) {
    console.warn(`⚠️  Could not clear ${packagePath}:`, error.message);
  }
});

// Instructions for manual cleanup
console.log('\n📱 Manual cleanup required:');
console.log('1. If using iOS Simulator: Reset simulator (Device > Erase All Content and Settings)');
console.log('2. If using Android Emulator: Wipe data (AVD Manager > Wipe Data)');
console.log('3. If using physical device: Clear app data/uninstall and reinstall');
console.log('\n🔄 Then run:');
console.log('npm install');
console.log('expo start --clear');

console.log('\n✨ Authentication cache cleanup complete!');
