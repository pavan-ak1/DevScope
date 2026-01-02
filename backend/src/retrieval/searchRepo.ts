import { embeddings } from "../embeddings/geminiEmbedder.js";
import { qdrantClient } from "../vectorStore/qdrantStore.js";
export async function searchRepo(
  collectionName: string,
  query: string,
  userId: string,
  limit = 5
) {
  // Embed the query
  const queryVector = await embeddings.embedQuery(query);

  // Semantic search with user isolation
  const results = await qdrantClient.search(collectionName, {
    vector: queryVector,
    limit,
    with_payload: true,
    filter: {
      must: [
        {
          key: "user_id",
          match: { value: userId },
        },
      ],
    },
  });

  for (const result of results) {
    const payload = result.payload as any;

    console.log("--------------------------------------------------");
    console.log(payload.file_path);
    console.log("score:", result.score.toFixed(3));
    console.log(
      "code:",
      payload.text.slice(0, 200).replace(/\n/g, " ")
    );
  }
}
