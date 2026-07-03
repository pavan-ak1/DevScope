import cosineSimilarity from "cosine-similarity";
import { embedQuery } from "../embeddings/mistralEmbedder.js";

export async function contextPrecision(context: string[], groundTruth: string) {

  const gtEmbedding = await embedQuery(groundTruth);

  const chunkEmbeddings = await Promise.all(
    context.map(chunk => embedQuery(chunk))
  );

  let relevant = 0;

  for (const chunkEmbedding of chunkEmbeddings) {
    const score = cosineSimilarity(gtEmbedding, chunkEmbedding);
    console.log("Similarity:", score);
    if (score > 0.55) relevant++;
  }

  return relevant / context.length;
}