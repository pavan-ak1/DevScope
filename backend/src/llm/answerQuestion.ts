import { embeddings } from "../embeddings/geminiEmbedder.js";
import { qdrantClient } from "../vectorStore/qdrantStore.js";
import { llm } from "./cerebrasLLM.js";
import { groqLlm } from "./groqLLM.js";
import { buildRagPrompt } from "./ragPrompt.js";

function isRecoverableLLMError(error: any): boolean {
  const message = error?.message?.toLowerCase() || "";

  return (
    message.includes("rate limit") ||
    message.includes("quota") ||
    message.includes("429") ||
    message.includes("too many requests") ||
    message.includes("overloaded")
  );
}

export async function answerQuestion(
  collectionName: string,
  question: string,
  userId:string,
  topK = 3
) {

  if(!userId){
    throw new Error("User id is required for answering questions");
  }
  const queryVector = await embeddings.embedQuery(question);

  const results = await qdrantClient.search(collectionName, {
    vector: queryVector,
    limit: topK,
    with_payload: true,
    filter:{
      must:[
        {
          key:"user_id",
          match:{
            value:userId
          }
        }
      ]
    }
  });

  const MAX_CHARS_PER_CHUNK = 1200; // ~300 tokens
  const MAX_CHUNKS = 3;

  const retrievedChunks = results
    .slice(0, MAX_CHUNKS)
    .map((r) => {
      const payload = r.payload as any;

      return {
        file_path: payload?.file_path ?? "unknown",
        text: (payload?.text ?? "").slice(0, MAX_CHARS_PER_CHUNK),
      };
    })
    .filter((c) => c.text.length > 0);

    if (retrievedChunks.length === 0) {
    return "No relevant code found for this question.";
  }

  const prompt = buildRagPrompt(question, retrievedChunks);

  try {
    const response = await llm.invoke(prompt);
    return response.content;
  } catch (error: any) {
    console.error("Cerebras LLM failed:", error.message);

    if (!isRecoverableLLMError(error)) {
      throw error;
    }

    console.warn("Falling back to Groq LLM..");

    const fallBackResponse = await groqLlm.invoke(prompt);
    return fallBackResponse.content;
  }
}

// //test
// const answer = await answerQuestion(
//   "portfolio_repo",
//   "Where is authentication implemented?"
// );

// console.log("\nANSWER:\n");
// console.log(answer);
