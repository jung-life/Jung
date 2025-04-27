// update-rogers-avatar-record.js
// This script updates the avatars table to use the carl_rogers.png file for Carl Rogers

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Use service role key instead of anon key

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase environment variables are not set.');
  console.error('Please set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// The filename of the avatar in the Supabase storage
const fileName = 'carl_rogers.png';

async function updateAvatarRecord() {
  try {
    console.log('Updating avatars table for Carl Rogers...');
    
    // First check if Carl Rogers exists in the avatars table
    const { data: existingAvatar, error: fetchError } = await supabase
      .from('avatars')
      .select('*')
      .eq('avatar_id', 'rogers')
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking for existing avatar:', fetchError);
      return;
    }
    
    if (existingAvatar) {
      // Update existing record
      console.log('Found existing record for Carl Rogers, updating image_url...');
      
      const { error: updateError } = await supabase
        .from('avatars')
        .update({ image_url: fileName })
        .eq('avatar_id', 'rogers');
      
      if (updateError) {
        console.error('Error updating avatar record:', updateError);
        return;
      }
      
      console.log('Avatar record updated successfully!');
    } else {
      // Insert new record
      console.log('No record found for Carl Rogers, creating new record...');
      
      // First, get the maximum order value to place the new avatar at the end
      const { data: maxOrderData, error: maxOrderError } = await supabase
        .from('avatars')
        .select('order')
        .order('order', { ascending: false })
        .limit(1);
        
      if (maxOrderError) {
        console.error('Error getting max order value:', maxOrderError);
        return;
      }
      
      // Default to 1 if no avatars exist, otherwise use max + 1
      const newOrder = maxOrderData && maxOrderData.length > 0 ? maxOrderData[0].order + 1 : 1;
      
      const { error: insertError } = await supabase
        .from('avatars')
        .insert([
          { 
            avatar_id: 'rogers', 
            name: 'Carl Rogers', 
            image_url: fileName,
            description: 'American psychologist known for his humanistic approach and client-centered therapy.',
            order: newOrder
          }
        ]);
      
      if (insertError) {
        console.error('Error inserting avatar record:', insertError);
        return;
      }
      
      console.log('Avatar record created successfully!');
    }
    
    console.log('Carl Rogers avatar record has been updated to use', fileName);
    console.log('Public URL:', `${supabaseUrl}/storage/v1/object/public/avatars/${fileName}`);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

updateAvatarRecord();
