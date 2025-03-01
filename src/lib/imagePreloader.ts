import { Image } from 'react-native';
import { availableAvatars } from '../components/SimpleAvatar';
import { getAvatarUrl } from './supabase';

export const preloadAvatarImages = () => {
  console.log('Preloading avatar images...');
  
  const preloadPromises = availableAvatars.map(avatar => {
    const url = getAvatarUrl(avatar.filename);
    console.log(`Preloading avatar: ${avatar.id} from ${url}`);
    
    return new Promise((resolve, reject) => {
      Image.prefetch(url)
        .then(() => {
          console.log(`Successfully preloaded: ${avatar.id}`);
          resolve(true);
        })
        .catch(error => {
          console.error(`Failed to preload ${avatar.id}:`, error);
          resolve(false); // Resolve with false instead of rejecting to continue preloading others
        });
    });
  });
  
  return Promise.all(preloadPromises);
}; 