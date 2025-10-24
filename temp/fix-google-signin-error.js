#!/usr/bin/env node

/**
 * Google Sign-In Error Diagnostic and Fix Script
 * 
 * This script diagnoses and fixes common Google Sign-In issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Google Sign-In Error Diagnostic Tool');
console.log('=====================================\n');

// Check environment variables
function checkEnvironmentVariables() {
  console.log('1. Checking Environment Variables...');
  
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  const requiredVars = [
    'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
    'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  const missingVars = [];
  const foundVars = {};
  
  requiredVars.forEach(varName => {
    const line = envLines.find(line => line.startsWith(`${varName}=`));
    if (line) {
      const value = line.split('=')[1];
      foundVars[varName] = value;
      console.log(`✅ ${varName}: ${value ? 'Set' : 'Empty'}`);
    } else {
      missingVars.push(varName);
      console.log(`❌ ${varName}: Missing`);
    }
  });
  
  if (missingVars.length > 0) {
    console.log(`\n❌ Missing environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  console.log('✅ All required environment variables are set\n');
  return true;
}

// Check Google Services configuration
function checkGoogleServicesConfig() {
  console.log('2. Checking Google Services Configuration...');
  
  // Check google-services.json
  const googleServicesPath = path.join(__dirname, 'google-services.json');
  if (fs.existsSync(googleServicesPath)) {
    console.log('✅ google-services.json found');
    
    try {
      const googleServices = JSON.parse(fs.readFileSync(googleServicesPath, 'utf8'));
      const clientId = googleServices.client[0]?.oauth_client?.find(client => 
        client.client_type === 3
      )?.client_id;
      
      if (clientId) {
        console.log(`✅ Web client ID in google-services.json: ${clientId}`);
      } else {
        console.log('❌ Web client ID not found in google-services.json');
      }
    } catch (error) {
      console.log('❌ Error parsing google-services.json:', error.message);
    }
  } else {
    console.log('❌ google-services.json not found');
  }
  
  // Check GoogleService-Info.plist
  const googleServiceInfoPath = path.join(__dirname, 'GoogleService-Info.plist');
  if (fs.existsSync(googleServiceInfoPath)) {
    console.log('✅ GoogleService-Info.plist found');
  } else {
    console.log('❌ GoogleService-Info.plist not found');
  }
  
  console.log('');
}

// Check Supabase configuration
function checkSupabaseConfig() {
  console.log('3. Checking Supabase Configuration...');
  
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  const supabaseUrl = envLines.find(line => line.startsWith('EXPO_PUBLIC_SUPABASE_URL='))?.split('=')[1];
  const supabaseKey = envLines.find(line => line.startsWith('EXPO_PUBLIC_SUPABASE_ANON_KEY='))?.split('=')[1];
  
  if (supabaseUrl && supabaseUrl.startsWith('https://')) {
    console.log('✅ Supabase URL is valid');
  } else {
    console.log('❌ Supabase URL is invalid or missing');
  }
  
  if (supabaseKey && supabaseKey.length > 50) {
    console.log('✅ Supabase anon key appears valid');
  } else {
    console.log('❌ Supabase anon key appears invalid or missing');
  }
  
  console.log('');
}

// Check app configuration
function checkAppConfig() {
  console.log('4. Checking App Configuration...');
  
  // Check app.json
  const appJsonPath = path.join(__dirname, 'app.json');
  if (fs.existsSync(appJsonPath)) {
    try {
      const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
      const bundleId = appJson.expo?.ios?.bundleIdentifier;
      const packageName = appJson.expo?.android?.package;
      
      console.log(`✅ iOS Bundle ID: ${bundleId || 'Not set'}`);
      console.log(`✅ Android Package: ${packageName || 'Not set'}`);
      
      // Check if Google plugin is configured
      const plugins = appJson.expo?.plugins || [];
      const hasGooglePlugin = plugins.some(plugin => 
        plugin === '@react-native-google-signin/google-signin' ||
        (Array.isArray(plugin) && plugin[0] === '@react-native-google-signin/google-signin')
      );
      
      if (hasGooglePlugin) {
        console.log('✅ Google Sign-In plugin configured in app.json');
      } else {
        console.log('❌ Google Sign-In plugin not found in app.json');
      }
      
    } catch (error) {
      console.log('❌ Error parsing app.json:', error.message);
    }
  } else {
    console.log('❌ app.json not found');
  }
  
  console.log('');
}

// Generate fix recommendations
function generateFixRecommendations() {
  console.log('5. Fix Recommendations:');
  console.log('======================');
  
  console.log('Based on the error "No ID token received from Google or Supabase not available":');
  console.log('');
  
  console.log('A. Environment Variables:');
  console.log('   - Ensure all Google OAuth client IDs are correctly set in .env');
  console.log('   - Verify Supabase URL and anon key are valid');
  console.log('');
  
  console.log('B. Google Console Configuration:');
  console.log('   - Verify OAuth 2.0 client IDs are created for both iOS and Web');
  console.log('   - Ensure iOS client ID has correct bundle identifier');
  console.log('   - Ensure Web client ID is configured for Supabase authentication');
  console.log('');
  
  console.log('C. Supabase Configuration:');
  console.log('   - Verify Google provider is enabled in Supabase Auth settings');
  console.log('   - Ensure Web client ID is added to Supabase Google provider config');
  console.log('   - Check that Supabase client is properly initialized');
  console.log('');
  
  console.log('D. App Configuration:');
  console.log('   - Ensure google-services.json and GoogleService-Info.plist are present');
  console.log('   - Verify Google Sign-In plugin is added to app.json');
  console.log('   - Check that bundle ID matches Google Console configuration');
  console.log('');
  
  console.log('E. Code Issues:');
  console.log('   - Verify Google Sign-In is properly initialized on app start');
  console.log('   - Check that Supabase client is not null when Google Sign-In is called');
  console.log('   - Ensure proper error handling for missing ID tokens');
}

// Main execution
async function main() {
  const envCheck = checkEnvironmentVariables();
  checkGoogleServicesConfig();
  checkSupabaseConfig();
  checkAppConfig();
  generateFixRecommendations();
  
  if (!envCheck) {
    console.log('\n❌ Critical issues found. Please fix environment variables first.');
    process.exit(1);
  } else {
    console.log('\n✅ Basic configuration appears correct.');
    console.log('If Google Sign-In is still failing, check the recommendations above.');
  }
}

main().catch(console.error);
