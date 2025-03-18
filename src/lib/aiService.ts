import { anonymizeText, encryptData } from './security';

const rateLimit = (fn, delay) => {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall < delay) return;
    lastCall = now;
    return fn(...args);
  };
};

export const processAIRequest = rateLimit(async (userInput: string, userId: string) => {
  try {
    // 1. Anonymize the user input
    const anonymizedInput = anonymizeText(userInput);
    
    // 2. Send to OpenAI with no identifying information
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a Jungian analysis assistant." },
          { role: "user", content: anonymizedInput }
        ],
        temperature: 0.7
      })
    });
    
    const data = await response.json();
    
    // 3. Encrypt the response before storing
    const encryptedResponse = encryptData(data.choices[0].message.content);
    
    // 4. Store encrypted response in database
    await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        encrypted_prompt: encryptData(userInput),
        encrypted_response: encryptedResponse,
        created_at: new Date().toISOString()
      });
      
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error in AI processing:', error);
    throw new Error('Failed to process your request');
  }
}, 1000); // 1 second delay 