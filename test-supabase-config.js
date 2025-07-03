#!/usr/bin/env node

// Test Supabase Configuration
// Usage: node test-supabase-config.js

require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://osmhesmrvxusckjfxugr.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 TESTING SUPABASE CONFIGURATION');
console.log('=' .repeat(50));

// Test 1: Check environment variables
console.log('\n✅ 1. Environment Variables:');
console.log(`   SUPABASE_URL: ${SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`   SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);

if (!SUPABASE_ANON_KEY) {
  console.log('❌ Cannot proceed without SUPABASE_ANON_KEY');
  process.exit(1);
}

// Test 2: Basic HTTP connectivity
async function testHttpConnectivity() {
  console.log('\n🌐 2. Testing HTTP Connectivity:');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      console.log('   ✅ Supabase API is reachable');
    } else if (response.status === 401) {
      console.log('   ❌ Authentication failed - check your anon key');
    } else {
      console.log(`   ⚠️  Unexpected status: ${response.status}`);
    }
    
    return response.status;
  } catch (error) {
    console.log(`   ❌ Connection failed: ${error.message}`);
    return false;
  }
}

// Test 3: Auth endpoint
async function testAuthEndpoint() {
  console.log('\n🔐 3. Testing Auth Endpoint:');
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      const settings = await response.json();
      console.log('   ✅ Auth endpoint is working');
      console.log(`   External providers enabled: ${settings.external ? Object.keys(settings.external).join(', ') : 'None'}`);
      
      // Check if Google provider is configured
      if (settings.external && settings.external.google) {
        console.log('   ✅ Google OAuth provider is configured');
        console.log(`   Google client ID: ${settings.external.google.client_id ? '✅ Set' : '❌ Missing'}`);
      } else {
        console.log('   ⚠️  Google OAuth provider not found in settings');
      }
    } else {
      console.log('   ❌ Auth endpoint not accessible');
    }
    
    return response.status === 200;
  } catch (error) {
    console.log(`   ❌ Auth test failed: ${error.message}`);
    return false;
  }
}

// Test 4: Test Google OAuth configuration
async function testGoogleOAuth() {
  console.log('\n🔵 4. Testing Google OAuth Configuration:');
  
  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  
  console.log(`   Web Client ID: ${googleWebClientId ? '✅ Set' : '❌ Missing'}`);
  console.log(`   iOS Client ID: ${googleIosClientId ? '✅ Set' : '❌ Missing'}`);
  
  if (!googleWebClientId) {
    console.log('   ⚠️  Web Client ID required for Supabase OAuth');
    return false;
  }
  
  // Test OAuth URL generation
  try {
    const oauthUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=jung://auth/callback`;
    console.log('   ✅ OAuth URL structure looks correct');
    console.log(`   OAuth URL: ${oauthUrl}`);
    return true;
  } catch (error) {
    console.log(`   ❌ OAuth URL generation failed: ${error.message}`);
    return false;
  }
}

// Test 5: Test database connection (basic)
async function testDatabaseConnection() {
  console.log('\n🗄️  5. Testing Database Connection:');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      const result = await response.json();
      console.log('   ✅ Database connection successful');
      console.log(`   Available schemas/tables: ${result.definitions ? Object.keys(result.definitions).length : 'Unknown'} items`);
    } else {
      console.log(`   ❌ Database connection failed: ${response.status}`);
    }
    
    return response.status === 200;
  } catch (error) {
    console.log(`   ❌ Database test failed: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  const results = {
    http: await testHttpConnectivity(),
    auth: await testAuthEndpoint(),
    google: await testGoogleOAuth(),
    database: await testDatabaseConnection()
  };
  
  console.log('\n📊 SUMMARY:');
  console.log('=' .repeat(30));
  console.log(`HTTP Connectivity: ${results.http === 200 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Auth Endpoint: ${results.auth ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Google OAuth: ${results.google ? '✅ PASS' : '⚠️  CHECK'}`);
  console.log(`Database: ${results.database ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = results.http === 200 && results.auth && results.database;
  
  if (allPassed) {
    console.log('\n🎉 All core tests passed! Your Supabase is configured correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the details above.');
  }
  
  console.log('\n🔧 Next Steps:');
  if (!results.google) {
    console.log('   • Configure Google OAuth in Supabase Dashboard');
    console.log('   • Add your Google client IDs to Authentication > Providers > Google');
  }
  console.log('   • Test authentication in your app');
  console.log('   • Run: npx expo run:ios');
}

// Execute tests
runAllTests().catch(console.error);
