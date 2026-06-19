import axios from "axios";
import { env } from "../env.js";

export async function callGemini(prompt: string): Promise<string> {
  if (!env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is not configured");
  }

  const res = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GOOGLE_API_KEY}`,
    {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    },
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  if (res.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
    return res.data.candidates[0].content.parts[0].text;
  }

  throw new Error("Unexpected response structure from Gemini API");
}
