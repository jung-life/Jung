// upload-carl-rogers-avatar.js
// This script uploads the carl_rogers.png file to the Supabase storage bucket
// and updates the avatars table with the new image URL

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase environment variables are not set.');
  console.error('Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Path to the avatar file
const filePath = path.join(__dirname, 'src', 'assets', 'avtars', 'carl_rogers.png');
const fileName = 'carl_rogers.png';

async function uploadAvatar() {
  try {
    console.log('Reading file from:', filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('Error: File does not exist at path:', filePath);
      return;
    }
    
    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    
    console.log('Uploading avatar to Supabase Storage...');
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars') // bucket name
      .upload(fileName, fileBuffer, {
        contentType: 'image/png',
        upsert: true // overwrite if exists
      });
    
    if (error) {
      console.error('Error uploading avatar:', error);
      return;
    }
    
    console.log('Avatar uploaded successfully!');
    console.log('Public URL:', `${supabaseUrl}/storage/v1/object/public/avatars/${fileName}`);
    
    // Now update the avatars table for Carl Rogers
    console.log('Updating avatars table...');
    
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
      const { error: insertError } = await supabase
        .from('avatars')
        .insert([
          { 
            avatar_id: 'rogers', 
            name: 'Carl Rogers', 
            image_url: fileName,
            description: 'American psychologist known for his humanistic approach and client-centered therapy.'
          }
        ]);
      
      if (insertError) {
        console.error('Error inserting avatar record:', insertError);
        return;
      }
      
      console.log('Avatar record created successfully!');
    }
    
    console.log('Carl Rogers avatar has been updated successfully!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

uploadAvatar();
