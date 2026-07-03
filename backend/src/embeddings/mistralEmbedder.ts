import axios from "axios";
import { env } from "../env.js";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry<T>(fn: () => Promise<T>, retries = 5, delayMs = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error.response?.status === 429 || error.message?.includes("429");
    if (isRateLimit && retries > 0) {
      console.warn(`Mistral API 429 rate limit hit. Retrying in ${delayMs}ms... (${retries} retries left)`);
      await delay(delayMs);
      return fetchWithRetry(fn, retries - 1, delayMs * 2);
    }
    throw error;
  }
}

async function embedQueryWithMistralAPI(text: string): Promise<number[]> {
  if (!env.MISTRAL_API_KEY) {
    throw new Error("MISTRAL_API_KEY is not configured.");
  }
  const cleanText = text.replace(/\n/g, " ");
  const res = await fetchWithRetry(() =>
    axios.post(
      "https://api.mistral.ai/v1/embeddings",
      {
        model: "mistral-embed",
        input: [cleanText]
      },
      {
        headers: {
          "Authorization": `Bearer ${env.MISTRAL_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    )
  );

  if (res.data?.data?.[0]?.embedding) {
    return res.data.data[0].embedding;
  }
  throw new Error("Invalid response format from Mistral embedding API");
}

async function embedChunksWithMistralAPI(texts: string[]): Promise<number[][]> {
  if (!env.MISTRAL_API_KEY) {
    throw new Error("MISTRAL_API_KEY is not configured.");
  }

  const batchSize = 50;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    if (i > 0) {
      // Small delay between batches to respect rate limits
      await delay(500);
    }

    const chunk = texts.slice(i, i + batchSize).map(text => text.replace(/\n/g, " "));

    const res = await fetchWithRetry(() =>
      axios.post(
        "https://api.mistral.ai/v1/embeddings",
        {
          model: "mistral-embed",
          input: chunk
        },
        {
          headers: {
            "Authorization": `Bearer ${env.MISTRAL_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      )
    );

    if (res.data?.data) {
      const data = res.data.data;
      // Sort by index to ensure correct ordering of embeddings
      data.sort((a: any, b: any) => a.index - b.index);
      results.push(...data.map((e: any) => e.embedding));
    } else {
      throw new Error("Invalid response format from Mistral batch embedding API");
    }
  }

  return results;
}

export async function embedChunks(texts: string[]): Promise<number[][]> {
  try {
    return await embedChunksWithMistralAPI(texts);
  } catch (error: any) {
    console.error("Mistral API embeddings failed:", error.message || error);
    throw error;
  }
}

export async function embedQuery(text: string): Promise<number[]> {
  try {
    return await embedQueryWithMistralAPI(text);
  } catch (error: any) {
    console.error("Mistral API embeddings failed:", error.message || error);
    throw error;
  }
}
