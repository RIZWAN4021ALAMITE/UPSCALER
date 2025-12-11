import { GoogleGenAI } from "@google/genai";

const getApiKey = (): string | undefined => {
  return process.env.API_KEY;
};

// Converts a File object to a base64 string
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeImage = async (file: File): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("No API key found. Skipping AI analysis.");
    return "AI Analysis unavailable (Missing Key)";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const imagePart = await fileToGenerativePart(file);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
            imagePart,
            { text: "Analyze this image for an artist. Briefly identify: 1. The art style (watercolor, line art, vector). 2. Confirm if the resolution is low and recommended upscale factor. Keep it under 30 words." }
        ]
      }
    });

    return response.text || "Could not analyze image.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Analysis failed.";
  }
};