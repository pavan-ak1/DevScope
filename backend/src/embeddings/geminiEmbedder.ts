import axios from "axios";
import { env } from "../env.js";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const googleApiKeys = (env.GOOGLE_API_KEY || "").split(",").map(k => k.trim()).filter(Boolean);
let activeKeyIndex = 0;

function getGoogleApiKey(): string {
  if (googleApiKeys.length === 0) {
    throw new Error("GOOGLE_API_KEY is not configured.");
  }
  return googleApiKeys[activeKeyIndex];
}

function rotateGoogleApiKey() {
  if (googleApiKeys.length > 1) {
    activeKeyIndex = (activeKeyIndex + 1) % googleApiKeys.length;
    console.log(`Rotated to Gemini API Key index ${activeKeyIndex}`);
  }
}

async function fetchWithRetry<T>(fn: () => Promise<T>, retries = 5, delayMs = 5000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error.response?.status === 429 || error.message?.includes("429");
    if (isRateLimit) {
      if (googleApiKeys.length > 1) {
        rotateGoogleApiKey();
        if (retries > 0) {
          console.warn(`Gemini API 429 hit. Rotated API key and retrying in ${delayMs}ms...`);
          await delay(delayMs);
          return fetchWithRetry(fn, retries - 1, delayMs);
        }
      } else {
        if (retries > 0) {
          console.warn(`Gemini API 429 rate limit hit. Retrying in ${delayMs}ms... (${retries} retries left)`);
          await delay(delayMs);
          return fetchWithRetry(fn, retries - 1, delayMs * 2);
        }
      }
    }
    throw error;
  }
}

async function embedQueryWithGeminiAPI(text: string): Promise<number[]> {
  if (googleApiKeys.length === 0) {
    throw new Error("GOOGLE_API_KEY is not configured for Gemini embeddings.");
  }
  const cleanText = text.replace(/\n/g, " ");
  const res = await fetchWithRetry(() =>
    axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${getGoogleApiKey()}`,
      {
        content: {
          parts: [{ text: cleanText }]
        },
        outputDimensionality: 768
      }
    )
  );
  if (res.data?.embedding?.values) {
    return res.data.embedding.values;
  }
  throw new Error("Invalid response format from Gemini embedding API");
}

async function embedChunksWithGeminiAPI(texts: string[]): Promise<number[][]> {
  if (googleApiKeys.length === 0) {
    throw new Error("GOOGLE_API_KEY is not configured for Gemini embeddings.");
  }

  const batchSize = 100;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    if (i > 0) {
      // Add a 4.5-second delay between batches to respect the 15 RPM free tier limit
      await delay(4500);
    }

    const chunk = texts.slice(i, i + batchSize);
    const requests = chunk.map(text => ({
      model: "models/gemini-embedding-001",
      content: {
        parts: [{ text: text.replace(/\n/g, " ") }]
      },
      outputDimensionality: 768
    }));

    const res = await fetchWithRetry(() =>
      axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key=${getGoogleApiKey()}`,
        { requests }
      )
    );

    if (res.data?.embeddings) {
      results.push(...res.data.embeddings.map((e: any) => e.values));
    } else {
      throw new Error("Invalid response format from Gemini batch embedding API");
    }
  }

  return results;
}

export async function embedChunks(texts: string[]): Promise<number[][]> {
  try {
    return await embedChunksWithGeminiAPI(texts);
  } catch (geminiError: any) {
    console.error("Gemini API embeddings failed:", geminiError.message || geminiError);
    throw geminiError;
  }
}

export async function embedQuery(text: string): Promise<number[]> {
  try {
    return await embedQueryWithGeminiAPI(text);
  } catch (geminiError: any) {
    console.error("Gemini API embeddings failed:", geminiError.message || geminiError);
    throw geminiError;
  }
}