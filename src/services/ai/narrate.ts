import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
  // eslint-disable-next-line no-console
  console.log("Gemini AI initialized");
}

export async function generateNarration(prompt: string): Promise<string> {
  if (!genAI) {
    return "DriveLens summary (fallback): " + prompt;
  }
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    return text.trim() || prompt;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Gemini narration failed:", err);
    return "DriveLens summary (fallback): " + prompt;
  }
}


