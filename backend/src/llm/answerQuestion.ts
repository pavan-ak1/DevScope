import { embeddings } from "../embeddings/geminiEmbedder.js";
import { qdrantClient } from "../vectorStore/qdrantStore.js";
import { llm } from "./cerebrasLLM.js";
import { buildRagPrompt } from "./ragPrompt.js";

export async function answerQuestion(collectionName:string,question:string, topK=5){
    const queryVector = await embeddings.embedQuery(question);

    const results = await qdrantClient.search(collectionName,{
        vector: queryVector,
    limit: topK,
    with_payload: true,
    });

    const retrievedChunks = results.map((r) => ({
    file_path: (r.payload as any).file_path,
    text: (r.payload as any).text,
  }));

  const prompt = buildRagPrompt(question,retrievedChunks);

  const response = await  llm.invoke(prompt);

  return response.content;
}

// //test
// const answer = await answerQuestion(
//   "portfolio_repo",
//   "Where is authentication implemented?"
// );

// console.log("\nANSWER:\n");
// console.log(answer);