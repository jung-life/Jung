const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDisclaimerFlow() {
  console.log('🧪 Testing Disclaimer Flow');
  console.log('========================\n');

  try {
    // Test 1: Check if user_preferences table exists and has correct structure
    console.log('1. Checking user_preferences table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_preferences')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error accessing user_preferences table:', tableError.message);
      return;
    }
    console.log('✅ user_preferences table is accessible');

    // Test 2: Check current user session
    console.log('\n2. Checking current user session...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Error getting user:', userError.message);
      return;
    }
    
    if (!user) {
      console.log('ℹ️  No user currently logged in');
      console.log('   Please log in with a test account to test disclaimer flow');
      return;
    }
    
    console.log('✅ User logged in:', user.email);
    console.log('   User ID:', user.id);

    // Test 3: Check current disclaimer status
    console.log('\n3. Checking current disclaimer status...');
    const { data: preferences, error: prefError } = await supabase
      .from('user_preferences')
      .select('has_seen_disclaimer, disclaimer_version, created_at, updated_at')
      .eq('user_id', user.id)
      .single();
    
    if (prefError && prefError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error checking disclaimer status:', prefError.message);
      return;
    }
    
    if (!preferences) {
      console.log('⚠️  No user_preferences record found for this user');
      console.log('   This means the user should see the disclaimer screen');
      
      // Test 4: Create user preferences record (simulate ensureUserPreferences)
      console.log('\n4. Creating user_preferences record...');
      const { error: insertError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          has_seen_disclaimer: false,
          disclaimer_version: 1
        });
      
      if (insertError) {
        console.error('❌ Error creating user_preferences:', insertError.message);
        return;
      }
      console.log('✅ Created user_preferences record');
    } else {
      console.log('✅ User preferences found:');
      console.log('   Has seen disclaimer:', preferences.has_seen_disclaimer);
      console.log('   Disclaimer version:', preferences.disclaimer_version);
      console.log('   Created at:', preferences.created_at);
      console.log('   Updated at:', preferences.updated_at);
    }

    // Test 5: Test disclaimer acceptance simulation
    console.log('\n5. Testing disclaimer acceptance...');
    const { error: updateError } = await supabase
      .from('user_preferences')
      .update({
        has_seen_disclaimer: true,
        disclaimer_version: 2, // Current version
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);
    
    if (updateError) {
      console.error('❌ Error updating disclaimer status:', updateError.message);
      return;
    }
    console.log('✅ Successfully updated disclaimer status to accepted');

    // Test 6: Verify the update
    console.log('\n6. Verifying disclaimer status update...');
    const { data: updatedPrefs, error: verifyError } = await supabase
      .from('user_preferences')
      .select('has_seen_disclaimer, disclaimer_version, updated_at')
      .eq('user_id', user.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError.message);
      return;
    }
    
    console.log('✅ Verification successful:');
    console.log('   Has seen disclaimer:', updatedPrefs.has_seen_disclaimer);
    console.log('   Disclaimer version:', updatedPrefs.disclaimer_version);
    console.log('   Updated at:', updatedPrefs.updated_at);

    // Test 7: Test RPC function if it exists
    console.log('\n7. Testing RPC function (if available)...');
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('execute_sql', {
        sql_query: `SELECT has_seen_disclaimer FROM public.user_preferences WHERE user_id = '${user.id}';`
      });
      
      if (rpcError) {
        console.log('ℹ️  RPC function not available (this is okay):', rpcError.message);
      } else {
        console.log('✅ RPC function works:', rpcResult);
      }
    } catch (rpcError) {
      console.log('ℹ️  RPC function not available (this is okay)');
    }

    // Test 8: Reset disclaimer status for testing
    console.log('\n8. Resetting disclaimer status for testing...');
    const { error: resetError } = await supabase
      .from('user_preferences')
      .update({
        has_seen_disclaimer: false,
        disclaimer_version: 1
      })
      .eq('user_id', user.id);
    
    if (resetError) {
      console.error('❌ Error resetting disclaimer status:', resetError.message);
      return;
    }
    console.log('✅ Reset disclaimer status to false for testing');

    console.log('\n🎉 All disclaimer flow tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Database table accessible');
    console.log('   ✅ User session valid');
    console.log('   ✅ Disclaimer status checking works');
    console.log('   ✅ Disclaimer acceptance works');
    console.log('   ✅ Status updates properly');
    console.log('   ✅ Ready for app testing');
    
    console.log('\n🔄 Next Steps:');
    console.log('   1. Log out of the app completely');
    console.log('   2. Log back in with this account');
    console.log('   3. You should now see the disclaimer screen');
    console.log('   4. Test accepting/rejecting the disclaimer');

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

// Run the test
testDisclaimerFlow();
