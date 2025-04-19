// upload-avatar.js
// This script uploads the alfredadler.png file to the Supabase storage bucket

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
const filePath = path.join(__dirname, 'assets', 'avtars', 'alfredadler.png');

async function uploadAvatar() {
  try {
    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars') // bucket name
      .upload('alfredadler.png', fileBuffer, {
        contentType: 'image/png',
        upsert: true // overwrite if exists
      });
    
    if (error) {
      console.error('Error uploading avatar:', error);
      return;
    }
    
    console.log('Avatar uploaded successfully!');
    console.log('Public URL:', supabaseUrl + '/storage/v1/object/public/avatars/alfredadler.png');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

uploadAvatar();
