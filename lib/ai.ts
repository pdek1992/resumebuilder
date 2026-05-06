import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

const geminiKeys = [
  process.env.GEMINI_API_KEY_1, 
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
  process.env.GEMINI_API_KEY_6
].filter(Boolean) as string[];

const openaiKeys = [
  process.env.OPENAI_API_KEY_1, 
  process.env.OPENAI_API_KEY_2
].filter(Boolean) as string[];

export async function generateContent(prompt: string) {
  let attempt = 0;
  
  const systemPrompt = `You are an expert resume writer. Return ONLY the requested content. No introductory phrases, no "Here is your answer", no suggestions, no markdown wrappers unless explicitly requested.`;

  // Try Gemini first
  while(attempt < geminiKeys.length) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKeys[attempt]);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro",
        systemInstruction: systemPrompt 
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text) return text;
    } catch (e) { 
      console.error(`Gemini attempt ${attempt + 1} failed`, e);
      attempt++; 
    }
  }

  attempt = 0;
  // Fallback to OpenAI
  while(attempt < openaiKeys.length) {
    try {
      const openai = new OpenAI({ apiKey: openaiKeys[attempt] });
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt }, 
          { role: "user", content: prompt }
        ],
      });
      const text = response.choices[0].message.content;
      if (text) return text;
    } catch (e) { 
      console.error(`OpenAI attempt ${attempt + 1} failed`, e);
      attempt++; 
    }
  }
  throw new Error("All AI providers failed. Check quotas and keys.");
}
