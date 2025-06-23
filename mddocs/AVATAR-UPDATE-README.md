# Avatar Update for Carl Rogers

This document explains the process of updating the Carl Rogers avatar in the Jung app.

## What Was Done

1. Added a new avatar image for Carl Rogers (`carl_rogers.png`) to the Supabase storage bucket
2. Created a database record in the `avatars` table for Carl Rogers with the following details:
   - avatar_id: `rogers`
   - name: `Carl Rogers`
   - image_url: `carl_rogers.png`
   - description: `American psychologist known for his humanistic approach and client-centered therapy.`

## How It Works

The Jung app uses the TherapistAvatar component to display avatars for different therapists. When a therapist is selected in the app, the component fetches the avatar details from the `avatars` table in the Supabase database using the `avatar_id`.

The component then uses the `getAvatarUrl` function from `src/lib/supabase.ts` to construct the full URL to the avatar image in the Supabase storage bucket.

## How to Use Carl Rogers Avatar

To use the Carl Rogers avatar in the app, you need to specify the `avatarId` prop as `rogers` when using the TherapistAvatar component:

```tsx
<TherapistAvatar 
  isSpeaking={isSpeaking} 
  message={message} 
  avatarId="rogers" 
/>
```

## Verification

You can verify that the avatar is working correctly by:

1. Using the TherapistAvatar component with `avatarId="rogers"`
2. Checking that the image loads correctly
3. Confirming that the URL being used is: `https://osmhesmrvxusckjfxugr.supabase.co/storage/v1/object/public/avatars/carl_rogers.png`

## Scripts Created

Two scripts were created to help with this process:

1. `upload-carl-rogers-avatar.js` - A script to upload the avatar image to Supabase storage (not used since the image was already uploaded)
2. `update-rogers-avatar-record.js` - A script to update the database record for Carl Rogers

These scripts can be used as templates for adding other avatars in the future.
