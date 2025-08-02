import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export default async function genai(prompt, attachmentBase64, mimeType) {
  let modelName;
  let contents = [];
  contents.push({ text: prompt });

  if (attachmentBase64 && mimeType) {
    modelName = process.env.GEMINI_PRO_MODEL;
    contents.push({
      inlineData: {
        mimeType: mimeType,
        data: attachmentBase64,
      },
    });
  } else {
    modelName = process.env.GEMINI_FLASH_MODEL;
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: contents,
  });

  return response.text || "No response text available.";
}