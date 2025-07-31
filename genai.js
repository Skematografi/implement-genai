import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export default async function main(prompt) {
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL,
    contents: prompt,
  });

  return response.text || "No response text available.";
}