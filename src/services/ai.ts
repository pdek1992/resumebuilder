import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ResumeState } from '../store/ResumeContext';

// Support multiple API keys from env
const API_KEYS = (import.meta.env.VITE_GEMINI_API_KEYS || import.meta.env.VITE_GEMINI_API_KEY || '').split(',').map((k: string) => k.trim()).filter(Boolean);

let currentKeyIndex = 0;
let cachedModelName: string | null = null;

const getApiKey = () => API_KEYS[currentKeyIndex];

const rotateKey = () => {
  if (API_KEYS.length > 1) {
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    console.warn(`Rotating to next API key. Index: ${currentKeyIndex}`);
    return true;
  }
  return false;
};

/**
 * Dynamically finds the best available Flash model.
 * Prefers gemini-2.5-flash, then gemini-1.5-flash, then any stable flash model.
 */
export const getBestModel = async (retryCount = 0): Promise<string> => {
  if (cachedModelName && retryCount === 0) return cachedModelName;

  const apiKey = getApiKey();
  if (!apiKey) throw new Error('103'); // Auth error / No key

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) {
      if (response.status === 429) throw new Error('100'); // Quota
      if (response.status === 401 || response.status === 403) throw new Error('103'); // Auth
      throw new Error('104'); // Network/Provider
    }

    const data = await response.json();
    const models = data.models || [];
    
    // Preference order
    const preferences = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
    
    for (const pref of preferences) {
      if (models.some((m: any) => m.name.includes(pref))) {
        cachedModelName = models.find((m: any) => m.name.includes(pref)).name.split('/').pop();
        return cachedModelName!;
      }
    }

    // Fallback to any flash model that is not a preview
    const flashModel = models.find((m: any) => m.name.includes('flash') && !m.name.includes('preview') && !m.name.includes('lite'));
    if (flashModel) {
      cachedModelName = flashModel.name.split('/').pop();
      return cachedModelName!;
    }

    // Last resort: any flash model
    const anyFlash = models.find((m: any) => m.name.includes('flash'));
    if (anyFlash) {
      cachedModelName = anyFlash.name.split('/').pop();
      return cachedModelName!;
    }

    throw new Error('101'); // Model not found
  } catch (error: any) {
    if (['100', '101', '103', '104'].includes(error.message)) throw error;
    
    if (retryCount < API_KEYS.length) {
      if (rotateKey()) return getBestModel(retryCount + 1);
    }
    
    throw new Error('104');
  }
};

const executeWithRetry = async <T>(operation: (model: any) => Promise<T>, retryCount = 0): Promise<T> => {
  try {
    const modelName = await getBestModel();
    const genAI = new GoogleGenerativeAI(getApiKey());
    const model = genAI.getGenerativeModel({ model: modelName });
    return await operation(model);
  } catch (error: any) {
    console.error('AI Operation Error:', error);
    
    const errorCode = error.message;
    
    // If it's a quota or model error, try rotating key and re-finding model
    if ((errorCode === '100' || error.status === 429) && retryCount < API_KEYS.length) {
      if (rotateKey()) {
        cachedModelName = null; // Clear cache to re-evaluate
        return executeWithRetry(operation, retryCount + 1);
      }
    }

    // Map common provider errors to our internal codes
    if (error.status === 429) throw new Error('100');
    if (error.status === 404) throw new Error('101');
    if (error.status === 401 || error.status === 403) throw new Error('103');
    
    if (['100', '101', '102', '103', '104', '105'].includes(errorCode)) throw error;
    
    throw new Error('104');
  }
};

export const enhanceBulletPoint = async (text: string): Promise<string> => {
  return executeWithRetry(async (model) => {
    const prompt = `Rewrite the following resume bullet point to make it more impactful. Use the XYZ formula ("Achieved X measured by Y by doing Z") where possible. Keep it concise, professional, and ATS-friendly. Do not include quotes in the output. Remove any junk characters or non-printable symbols. START THE OUTPUT WITH A BULLET POINT (• ).\nOriginal: ${text}`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim().replace(/^["']|["']$/g, '');
  });
};

export const tailorResumeToJD = async (resumeData: ResumeState, jobDescription: string): Promise<Partial<ResumeState>> => {
  return executeWithRetry(async (model) => {
    const prompt = `
      You are an expert ATS optimization engineer.
      I will provide my current resume data (JSON) and a Job Description.
      Your task is to tailor my resume to perfectly match the Job Description.
      
      Target Role: ${resumeData.meta.targetRole || 'Not specified'}
      
      Job Description:
      ${jobDescription}
      
      Current Resume Data:
      ${JSON.stringify({
        summary: resumeData.summary,
        skills: resumeData.skills,
        experience: resumeData.experience,
        projects: resumeData.projects
      }, null, 2)}
      
      Return ONLY a valid JSON object containing these keys: 'summary', 'skills', 'experience', 'projects'. 
      Ensure 'experience' objects include the 'isCurrent' (boolean) field.
      For 'experience' and 'projects' descriptions, use a multi-line string where each line starts with a bullet point (• ).
      Do not include markdown code blocks. Clean all text from junk characters.
    `;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (e) {
      throw new Error('105'); // Parse failure
    }
  });
};

export const parseRawTextToResume = async (rawText: string): Promise<Partial<ResumeState>> => {
  return executeWithRetry(async (model) => {
    const prompt = `
      You are a professional resume parsing engine. I will provide raw text extracted from a resume PDF or DOCX file.
      Your task is to parse this text and map it into a strictly structured JSON object.
      
      CLEANING RULES:
      1. Remove all non-printable characters and junk symbols.
      2. Normalize whitespace.
      3. Ensure all dates are in a readable format (e.g. "Oct 2020" or "Present").
      4. If an end date indicates ongoing work, set "isCurrent" to true.
      
      The JSON object MUST follow this schema:
      {
        "personalInfo": { "fullName": "", "email": "", "phone": "", "location": "", "linkedin": "", "portfolio": "" },
        "summary": "",
        "skills": [],
        "languages": [],
        "experience": [
          { "id": "unique_id", "company": "", "role": "", "startDate": "", "endDate": "", "isCurrent": false, "description": "Bullet 1\\nBullet 2" }
        ],
        "education": [
          { "id": "unique_id", "institution": "", "degree": "", "startDate": "", "endDate": "", "score": "" }
        ],
        "projects": [
          { "id": "unique_id", "name": "", "description": "• Built X\\n• Used Y", "link": "" }
        ],
        "certifications": [
          { "id": "unique_id", "name": "", "issuer": "", "date": "" }
        ]
      }
      
      CRITICAL: All 'description' fields in experience and projects MUST be formatted as multiple lines, each starting with the bullet symbol (• ).

      Raw Resume Text:
      """
      ${rawText}
      """

      Return ONLY valid JSON.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (e) {
      throw new Error('105'); // Parse failure
    }
  });
};
