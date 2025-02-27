import { Message } from '../types';

// Environment variables should be set in your .env file
const API_URL = 'https://api.openai.com/v1';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

export const generateAIResponse = async (message: string, conversationHistory: Message[]) => {
  try {
    console.log('Calling OpenAI API with message:', message);
    
    const response = await fetch(`${API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // Using a more widely available model
        messages: [
          // System message to set the context
          {
            role: "system",
            content: "You are a Jungian-inspired AI assistant helping users explore their inner world through thoughtful dialogue. Respond with empathy, depth, and insight."
          },
          // Previous conversation history
          ...conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          // Current user message
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
    });
    
    console.log('API response status:', response.status);
    
    const responseText = await response.text();
    console.log('API response text:', responseText.substring(0, 200) + '...');
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${responseText}`);
    }
    
    const data = JSON.parse(responseText);
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI API');
    }
    
    return data.choices[0].message.content;
  } catch (error: unknown) {
    console.error('Error calling OpenAI API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error('Failed to get AI response: ' + errorMessage);
  }
}; 