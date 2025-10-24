// Test Supabase Connection
const testSupabaseConnection = async () => {
  const SUPABASE_URL = 'https://osmhesmrvxusckjfxugr.supabase.co';

  console.log('Testing Supabase connection...');

  try {
    // Test basic connectivity
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'test',
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.status === 401) {
      console.log('✅ Supabase is reachable (401 = needs auth, which is expected)');
    } else {
      console.log('❌ Unexpected response:', response.status);
    }

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
  }
};

// Run in Node.js
if (typeof process !== 'undefined' && process.env) {
  testSupabaseConnection();
}

export default testSupabaseConnection;