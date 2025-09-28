// Utility for loading avatar prompts from external JSON files
import depthDelverPrompt from '../prompts/depth-delver.json';
import flourishingGuidePrompt from '../prompts/flourishing-guide.json';
import sagePrompt from '../prompts/sage.json';
import awakenerPrompt from '../prompts/awakener.json';

export interface AvatarPrompt {
  name: string;
  personality: string;
  background: string;
  systemPrompt: string;
  fewShotExamples: FewShotExample[];
  responseGuidelines: string[];
}

export interface FewShotExample {
  userInput: string;
  assistantResponse: string;
}

// Load all avatar prompts from JSON files
export const avatarPrompts: Record<string, AvatarPrompt> = {
  depthdelver: depthDelverPrompt as AvatarPrompt,
  flourishingguide: flourishingGuidePrompt as AvatarPrompt,
  oracle: sagePrompt as AvatarPrompt, // oracle maps to sage
  morpheus: awakenerPrompt as AvatarPrompt, // morpheus maps to awakener
};

// Function to generate a complete prompt with few-shot examples
export function generatePromptForAvatar(
  avatarId: string,
  history: string,
  question: string
): string {
  console.log(`Generating prompt for avatar ID: ${avatarId}`);

  // Normalize the avatar ID to handle case sensitivity and trim any whitespace
  const normalizedAvatarId = avatarId.toLowerCase().trim();

  // Map any variations of avatar IDs to the correct keys in avatarPrompts
  const avatarIdMap: Record<string, string> = {
    'deepseer': 'depthdelver',
    'deep seer': 'depthdelver',
    'depthdelver': 'depthdelver',
    'depth delver': 'depthdelver',
    'depth-delver': 'depthdelver',
    'flourishingguide': 'flourishingguide',
    'the flourishing guide': 'flourishingguide',
    'flourishing-guide': 'flourishingguide',
    'oracle': 'oracle', // Key 'oracle', maps to 'Sage' display name
    'the oracle': 'oracle',
    'sage guide': 'oracle',
    'sage': 'oracle',
    'morpheus': 'morpheus', // Key 'morpheus', maps to 'Awakener' display name
    'awakener': 'morpheus'
  };

  // Get the standardized avatar ID
  const standardizedAvatarId = avatarIdMap[normalizedAvatarId] || normalizedAvatarId;

  console.log(`Standardized avatar ID: ${standardizedAvatarId}`);
  console.log(`Available avatar prompts: ${Object.keys(avatarPrompts).join(', ')}`);

  // Get the avatar prompt or default to Depth Delver
  const avatar = avatarPrompts[standardizedAvatarId];

  if (!avatar) {
    console.warn(`Avatar ID "${avatarId}" (normalized to "${normalizedAvatarId}", standardized to "${standardizedAvatarId}") not found in avatarPrompts. Using Depth Delver as fallback.`);
    // Default to Depth Delver if no match
    return buildPromptWithExamples(avatarPrompts.depthdelver, history, question);
  }

  return buildPromptWithExamples(avatar, history, question);
}

// Build a complete prompt including system prompt, few-shot examples, and current conversation
function buildPromptWithExamples(
  avatar: AvatarPrompt,
  history: string,
  question: string
): string {
  let prompt = avatar.systemPrompt + '\n\n';

  // Add few-shot examples if available
  if (avatar.fewShotExamples && avatar.fewShotExamples.length > 0) {
    prompt += 'Here are some examples of how to respond:\n\n';

    avatar.fewShotExamples.forEach((example, index) => {
      prompt += `Example ${index + 1}:\n`;
      prompt += `User: ${example.userInput}\n`;
      prompt += `Assistant: ${example.assistantResponse}\n\n`;
    });
  }

  // Add response guidelines
  if (avatar.responseGuidelines && avatar.responseGuidelines.length > 0) {
    prompt += 'Response Guidelines:\n';
    avatar.responseGuidelines.forEach((guideline, index) => {
      prompt += `${index + 1}. ${guideline}\n`;
    });
    prompt += '\n';
  }

  // Add conversation history and current question
  prompt += 'Here is the conversational history (between the user and you) prior to the question:\n';
  prompt += '<history>\n';
  prompt += history;
  prompt += '\n</history>\n\n';

  prompt += 'Here is the user\'s question:\n';
  prompt += '<question>\n';
  prompt += question;
  prompt += '\n</question>\n\n';

  prompt += `As the ${avatar.name}, how do you respond to the user's question, strictly adhering to your unique perspective?\n\n`;
  prompt += 'Think about your answer first before you respond. Answer in an easy and friendly conversational style.\n';
  prompt += 'Put your response in <response></response> tags.';

  return prompt;
}

// Export avatar metadata for UI purposes
export function getAvatarMetadata() {
  return Object.entries(avatarPrompts).map(([id, prompt]) => ({
    id,
    name: prompt.name,
    personality: prompt.personality,
    background: prompt.background
  }));
}