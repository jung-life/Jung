import { useState } from 'react';

const useLLM = () => {
  const [loading, setLoading] = useState(false);

  const generateQuote = async (prompt: string): Promise<string> => {
    setLoading(true);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4', // or 'gpt-3.5-turbo' if preferred
          messages: [
            { role: 'system', content: 'You are a motivational quote generator.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      return data.choices[0].message.content; // Extract the generated quote
    } catch (error) {
      console.error('Error generating quote:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { generateQuote, loading };
};

export default useLLM; 