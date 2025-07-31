import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export default async function main(prompt = '', imgBase64 = '', mimeType = '') {
  let contents = [];
  if (!prompt) {
    return "No prompt provided.";
  } else {
    contents.push({
      text: prompt,
    });
  }

  if (imgBase64 && mimeType) {
    contents.push({
      inlineData: {
        mimeType: mimeType,
        data: imgBase64,
      },
    });
  }

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL,
    contents: contents,
  });

  return response.text || "No response text available.";
}