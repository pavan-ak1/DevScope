import { embedQuery } from "../embeddings/mistralEmbedder.js";
import { hybridSearch } from "../retrieval/hybridSearch.js";
import { buildRagPrompt } from "./ragPrompt.js";
import { callGroq } from "./groqLLM.js";
import { env } from "../env.js";

export async function answerQuestion(
  repoName: string,
  question: string,
  filter?: string
) {
  try {
    const queryEmbedding = await embedQuery(question);

    const results = await hybridSearch(repoName, question, queryEmbedding, 8, 60, filter);

    const { systemPrompt, userPrompt } = buildRagPrompt(question, results);

    console.log("Attempting Groq LLM...");
    if (!env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured.");
    }
    const response = await callGroq(systemPrompt, userPrompt);
    return { answer: response, context: results };

  } catch (err: any) {
    console.error(err);
    throw new Error(`Failed to answer question: ${err.message || err}`);
  }
}
