// test-conversation-history-enhanced.js
// Script to test the conversation history and insights feature in the enhanced version

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase connection details
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://osmhesmrvxusckjfxugr.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error('Error: EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable is not set.');
  console.error('Please set it in your .env file or provide it as an environment variable.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test user credentials - replace with your test user
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

if (!TEST_EMAIL || !TEST_PASSWORD) {
  console.error('Error: TEST_EMAIL and TEST_PASSWORD environment variables are not set.');
  console.error('Please set them in your .env file or provide them as environment variables.');
  process.exit(1);
}

async function runTests() {
  console.log('Testing Conversation History and Insights Feature (Enhanced Version)');
  console.log('==============================================================');
  
  try {
    // Step 1: Sign in with test user
    console.log('\n1. Signing in with test user...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    
    if (authError) {
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    
    console.log('✓ Authentication successful');
    const userId = authData.user.id;
    console.log(`User ID: ${userId}`);
    
    // Step 2: Check if conversation_history table exists
    console.log('\n2. Checking if conversation_history table exists...');
    const { data: historyTableData, error: historyTableError } = await supabase
      .from('conversation_history')
      .select('id')
      .limit(1);
      
    if (historyTableError && historyTableError.code === '42P01') {
      throw new Error('conversation_history table does not exist. Please run the migration script first.');
    } else if (historyTableError) {
      throw new Error(`Error checking conversation_history table: ${historyTableError.message}`);
    }
    
    console.log('✓ conversation_history table exists');
    
    // Step 3: Check if conversation_insights table exists
    console.log('\n3. Checking if conversation_insights table exists...');
    const { data: insightsTableData, error: insightsTableError } = await supabase
      .from('conversation_insights')
      .select('id')
      .limit(1);
      
    if (insightsTableError && insightsTableError.code === '42P01') {
      throw new Error('conversation_insights table does not exist. Please run the migration script first.');
    } else if (insightsTableError) {
      throw new Error(`Error checking conversation_insights table: ${insightsTableError.message}`);
    }
    
    console.log('✓ conversation_insights table exists');
    
    // Step 4: Get a conversation for testing
    console.log('\n4. Getting a conversation for testing...');
    const { data: conversationsData, error: conversationsError } = await supabase
      .from('conversations')
      .select('id, title')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (conversationsError) {
      throw new Error(`Error fetching conversations: ${conversationsError.message}`);
    }
    
    if (!conversationsData || conversationsData.length === 0) {
      throw new Error('No conversations found for testing. Please create a conversation first.');
    }
    
    const testConversationId = conversationsData[0].id;
    const testConversationTitle = conversationsData[0].title;
    console.log(`✓ Found conversation: ${testConversationId} (${testConversationTitle})`);
    
    // Step 5: Test saving a conversation to history
    console.log('\n5. Testing saving a conversation to history...');
    const { data: historyData, error: historyError } = await supabase
      .from('conversation_history')
      .upsert({
        user_id: userId,
        conversation_id: testConversationId,
        title: `Test History: ${testConversationTitle}`,
        saved_at: new Date().toISOString()
      })
      .select();
      
    if (historyError) {
      throw new Error(`Error saving conversation to history: ${historyError.message}`);
    }
    
    console.log('✓ Successfully saved conversation to history');
    const historyId = historyData[0].id;
    console.log(`History ID: ${historyId}`);
    
    // Step 6: Test creating conversation insights
    console.log('\n6. Testing creating conversation insights...');
    const { data: insightsData, error: insightsError } = await supabase
      .from('conversation_insights')
      .upsert({
        user_id: userId,
        conversation_id: testConversationId,
        content: 'This is a test insight for the conversation.',
        title: `Test Insight: ${testConversationTitle}`
      })
      .select();
      
    if (insightsError) {
      throw new Error(`Error creating conversation insights: ${insightsError.message}`);
    }
    
    console.log('✓ Successfully created conversation insights');
    const insightId = insightsData[0].id;
    console.log(`Insight ID: ${insightId}`);
    
    // Step 7: Test fetching conversation history
    console.log('\n7. Testing fetching conversation history...');
    const { data: fetchHistoryData, error: fetchHistoryError } = await supabase
      .from('conversation_history')
      .select(`
        id,
        conversation_id,
        title,
        saved_at,
        conversations:conversation_id (avatar_id)
      `)
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });
      
    if (fetchHistoryError) {
      throw new Error(`Error fetching conversation history: ${fetchHistoryError.message}`);
    }
    
    console.log(`✓ Successfully fetched conversation history (${fetchHistoryData.length} items)`);
    
    // Step 8: Test fetching conversation insights
    console.log('\n8. Testing fetching conversation insights...');
    const { data: fetchInsightsData, error: fetchInsightsError } = await supabase
      .from('conversation_insights')
      .select('*')
      .eq('conversation_id', testConversationId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (fetchInsightsError) {
      throw new Error(`Error fetching conversation insights: ${fetchInsightsError.message}`);
    }
    
    console.log(`✓ Successfully fetched conversation insights (${fetchInsightsData.length} items)`);
    
    // Step 9: Clean up test data
    console.log('\n9. Cleaning up test data...');
    
    // Delete test history
    const { error: deleteHistoryError } = await supabase
      .from('conversation_history')
      .delete()
      .eq('id', historyId);
      
    if (deleteHistoryError) {
      throw new Error(`Error deleting test history: ${deleteHistoryError.message}`);
    }
    
    // Delete test insight
    const { error: deleteInsightError } = await supabase
      .from('conversation_insights')
      .delete()
      .eq('id', insightId);
      
    if (deleteInsightError) {
      throw new Error(`Error deleting test insight: ${deleteInsightError.message}`);
    }
    
    console.log('✓ Successfully cleaned up test data');
    
    // Final result
    console.log('\n==============================================================');
    console.log('✅ All tests passed! The conversation history and insights feature is working correctly.');
    console.log('==============================================================');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();
