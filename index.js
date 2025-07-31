import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

async function main() {
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL,
    contents: "Apa itu Knowledge Graph?",
  });

  console.log(response.text);
}

main();