import axios from "axios";
import { env } from "../env.js";

export async function callCerebras(prompt: string) {
  const res = await axios.post(
    "https://api.cerebras.ai/v1/chat/completions",
    {
      model: "llama3.1-8b",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 512
    },
    {
      headers: {
        Authorization: `Bearer ${env.CEREBRAS_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  return res.data.choices[0].message.content;
}