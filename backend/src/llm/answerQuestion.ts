import { embedQuery } from "../embeddings/geminiEmbedder.js";
import { searchRepo } from "../vectorStore/searchRepo.js";
import { buildRagPrompt } from "./ragPrompt.js";
import { callOllama } from "./ollamaLLM.js";
import { callGroq } from "./groqLLM.js";
import { callGemini } from "./geminiLLM.js";
import { callCerebras } from "./cerebrasLLM.js";
import { env } from "../env.js";

export async function answerQuestion(
  repoName: string,
  question: string
) {
  try {
    const queryEmbedding = await embedQuery(question);

    const results = await searchRepo(repoName, queryEmbedding, 8);

    const prompt = buildRagPrompt(question, results);

    try {
      console.log("Attempting Ollama LLM...");
      const response = await callOllama(prompt);
      return { answer: response, context: results };
    } catch (err: any) {
      console.warn("Ollama LLM failed, attempting cloud fallbacks...", err.message || err);

      if (env.GOOGLE_API_KEY) {
        try {
          console.log("Trying Gemini LLM fallback...");
          const response = await callGemini(prompt);
          return { answer: response, context: results };
        } catch (geminiErr: any) {
          console.error("Gemini LLM fallback failed:", geminiErr.message || geminiErr);
        }
      }

      if (env.GROQ_API_KEY) {
        try {
          console.log("Trying Groq LLM fallback...");
          const response = await callGroq(prompt);
          return { answer: response, context: results };
        } catch (groqErr: any) {
          console.error("Groq LLM fallback failed:", groqErr.message || groqErr);
        }
      }

      if (env.CEREBRAS_API_KEY) {
        try {
          console.log("Trying Cerebras LLM fallback...");
          const response = await callCerebras(prompt);
          return { answer: response, context: results };
        } catch (cerebrasErr: any) {
          console.error("Cerebras LLM fallback failed:", cerebrasErr.message || cerebrasErr);
        }
      }

      throw new Error("Ollama LLM failed and all configured cloud fallbacks (Gemini, Groq, Cerebras) failed or were missing API keys.");
    }

  } catch (err) {
    console.error(err);
    throw new Error("Failed to answer question");
  }
}
