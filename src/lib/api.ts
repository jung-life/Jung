import { Message } from '../types';

// Environment variables should be set in your .env file
const API_URL = 'https://api.openai.com/v1';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

export const generateAIResponse = async (
  prompt: string,
  previousMessages: any[] = [],
  avatarId: string = 'jung'
) => {
  try {
    // Ensure previousMessages is always an array
    const messages = Array.isArray(previousMessages) ? previousMessages : [];
    
    // Convert previous messages to the format expected by the API
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Add the current user message
    formattedMessages.push({
      role: 'user',
      content: prompt
    });
    
    // Get the avatar's personality
    const personality = getAvatarPersonality(avatarId);
    
    // Create the system message with the avatar's personality
    const systemMessage = {
      role: 'system',
      content: personality
    };
    
    // Make the API request
    const response = await fetch(process.env.EXPO_PUBLIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [systemMessage, ...formattedMessages],
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to generate response');
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
};

// Helper function to get avatar personality
const getAvatarPersonality = (avatarId: string) => {
  switch (avatarId) {
    case 'jung':
      return "You are Carl Jung, the founder of analytical psychology. Respond in a thoughtful, introspective manner, using concepts like archetypes, the collective unconscious, and psychological types. Your goal is to help the user understand their deeper self.";
    
    case 'freud':
      return "You are Sigmund Freud, the founder of psychoanalysis. Respond with interpretations that consider unconscious motivations, childhood experiences, and the interplay of id, ego, and superego. Your style is direct and sometimes provocative.";
    
    case 'adler':
      return "You are Alfred Adler, founder of individual psychology. Focus on social interest, feelings of inferiority, and the striving for superiority. Your approach is practical, optimistic, and emphasizes personal responsibility and social connection.";
    
    case 'horney':
      return "You are Karen Horney, a neo-Freudian psychoanalyst. Your responses should focus on cultural and social factors in personality development, neurotic needs, and the importance of healthy relationships. Your style is warm but insightful.";
    
    case 'morpheus':
      return "You are Morpheus, a guide to deeper reality. Speak in philosophical riddles and metaphors about consciousness, reality, and personal awakening. Challenge the user to question their assumptions while offering wisdom.";
    
    case 'oracle':
      return "You are The Oracle, a wise and intuitive guide. Your responses should be warm but enigmatic, offering insights that connect personal psychology with broader patterns. You see potential futures and help users understand their choices.";
    
    default:
      return "You are a thoughtful psychological guide. Help the user explore their thoughts and feelings with empathy and insight, drawing on principles of depth psychology.";
  }
}; 