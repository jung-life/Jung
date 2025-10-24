// check-rogers-avatar.js
// This script checks the current avatar record for Carl Rogers in the database

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Use service role key

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase environment variables are not set.');
  console.error('Please set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAvatarRecord() {
  try {
    console.log('Checking avatars table for Carl Rogers...');
    
    // Check if Carl Rogers exists in the avatars table
    const { data: existingAvatar, error: fetchError } = await supabase
      .from('avatars')
      .select('*')
      .eq('avatar_id', 'rogers')
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') { // Not found error
        console.log('No record found for Carl Rogers in the avatars table.');
      } else {
        console.error('Error checking for existing avatar:', fetchError);
      }
      return;
    }
    
    if (existingAvatar) {
      console.log('Found existing record for Carl Rogers:');
      console.log(JSON.stringify(existingAvatar, null, 2));
      console.log('Image URL:', existingAvatar.image_url);
      console.log('Full URL:', `${supabaseUrl}/storage/v1/object/public/avatars/${existingAvatar.image_url}`);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkAvatarRecord();
