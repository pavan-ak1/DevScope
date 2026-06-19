import axios from "axios";
import { env } from "../env.js";

export async function callOllama(prompt: string): Promise<string> {
  const res = await axios.post(
    `${env.OLLAMA_BASE_URL}/api/chat`,
    {
      model: "llama3.2",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      stream: false
    }
  );

  return res.data.message.content;
}
