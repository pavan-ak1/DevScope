import { embedQuery } from "../embeddings/geminiEmbedder.js";
import { searchRepo } from "../vectorStore/searchRepo.js";
import { buildRagPrompt } from "./ragPrompt.js";
import { callGroq } from "./groqLLM.js";
import { env } from "../env.js";

export async function answerQuestion(
  repoName: string,
  question: string
) {
  try {
    const queryEmbedding = await embedQuery(question);

    const results = await searchRepo(repoName, queryEmbedding, 8);

    const prompt = buildRagPrompt(question, results);

    console.log("Attempting Groq LLM...");
    if (!env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured.");
    }
    const response = await callGroq(prompt);
    return { answer: response, context: results };

  } catch (err: any) {
    console.error(err);
    throw new Error(`Failed to answer question: ${err.message || err}`);
  }
}
