// Legacy avatar prompts - DEPRECATED
// This file is maintained for backward compatibility
// New implementation uses promptLoader.ts with external JSON files

import { generatePromptForAvatar as newGeneratePrompt, avatarPrompts as newAvatarPrompts, getAvatarMetadata } from './promptLoader';

// Re-export new implementation for backward compatibility
export const generatePromptForAvatar = newGeneratePrompt;

// Legacy interface for backward compatibility
export interface AvatarPrompt {
  name: string;
  personality: string;
  background: string;
  promptTemplate: string;
}

// Convert new format to legacy format for backward compatibility
export const avatarPrompts: Record<string, AvatarPrompt> = Object.entries(newAvatarPrompts).reduce((acc, [key, prompt]) => {
  acc[key] = {
    name: prompt.name,
    personality: prompt.personality,
    background: prompt.background,
    promptTemplate: prompt.systemPrompt, // Map systemPrompt to promptTemplate for compatibility
  };
  return acc;
}, {} as Record<string, AvatarPrompt>);

// Export metadata function
export { getAvatarMetadata };
