import { GoogleGenAI } from "@google/genai";

const KEY = "AIzaSyDhgglC5b8CSHsjYwo6jcUQYLdXsCisq9w";
const genAI = new GoogleGenAI({ apiKey: KEY });

export const generateCode = async (prompt) => {
  try {
    const result = await genAI.models.generateContent({
      model: "gemini-1.5-flash", 
      contents: [
        {
          role: "user",
          parts: [{ text: `Generate Python code for the following task without any multy comments and text only code and few single line comment for calrity And if user asks for matplot lib plots them dont save the figure and dont use plt.show() also.: ${prompt}` }],
        },
      ],
    });

    const text =
      result.candidates?.[0]?.content?.parts?.[0]?.text ||
      "# No response received from Gemini model.";

    return extractCode(text);
  } catch (error) {
    console.error("Error generating code:", error);
    return "# Error generating code: " + (error?.message || JSON.stringify(error));
  }
};

const extractCode = (text) => {
  const match = text.match(/``````/i);
  return match ? match[1].trim() : text.trim();
};
export const URLL = 'https://codeeditor-8mci.onrender.com';
