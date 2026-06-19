import { OllamaEmbeddings } from "@langchain/ollama";
import axios from "axios";
import { env } from "../env.js";

const ollamaEmbeddings = new OllamaEmbeddings({
  model: "nomic-embed-text",
  baseUrl: env.OLLAMA_BASE_URL,
});

async function embedQueryWithGeminiAPI(text: string): Promise<number[]> {
  if (!env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is not configured for Gemini fallback.");
  }
  const cleanText = text.replace(/\n/g, " ");
  const res = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${env.GOOGLE_API_KEY}`,
    {
      content: {
        parts: [{ text: cleanText }]
      },
      outputDimensionality: 768
    }
  );
  if (res.data?.embedding?.values) {
    return res.data.embedding.values;
  }
  throw new Error("Invalid response format from Gemini embedding API");
}

async function embedChunksWithGeminiAPI(texts: string[]): Promise<number[][]> {
  if (!env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is not configured for Gemini fallback.");
  }

  const batchSize = 100;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const chunk = texts.slice(i, i + batchSize);
    const requests = chunk.map(text => ({
      model: "models/gemini-embedding-001",
      content: {
        parts: [{ text: text.replace(/\n/g, " ") }]
      },
      outputDimensionality: 768
    }));

    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key=${env.GOOGLE_API_KEY}`,
      { requests }
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
    return await ollamaEmbeddings.embedDocuments(texts);
  } catch (error: any) {
    console.warn("Ollama embeddings failed, trying Gemini API fallback...", error.message || error);
    try {
      return await embedChunksWithGeminiAPI(texts);
    } catch (geminiError: any) {
      console.error("Gemini API embeddings fallback failed:", geminiError.message || geminiError);
      throw geminiError;
    }
  }
}

export async function embedQuery(text: string): Promise<number[]> {
  try {
    return await ollamaEmbeddings.embedQuery(text);
  } catch (error: any) {
    console.warn("Ollama embeddings failed, trying Gemini API fallback...", error.message || error);
    try {
      return await embedQueryWithGeminiAPI(text);
    } catch (geminiError: any) {
      console.error("Gemini API embeddings fallback failed:", geminiError.message || geminiError);
      throw geminiError;
    }
  }
}