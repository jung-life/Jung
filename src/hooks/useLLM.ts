import { useState } from 'react';

const useLLM = () => {
  const [loading, setLoading] = useState(false);

  const generateQuote = async (prompt: string): Promise<string> => {
    setLoading(true);
    try {
      // Replace with your actual LLM API call
      const response = await fetch('https://api.your-llm-service.com/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      return data.quote;
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