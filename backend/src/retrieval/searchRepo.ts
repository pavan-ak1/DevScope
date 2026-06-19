import { pgPool } from "../vectorStore/pgClient.js";
export async function searchRepo(
  repoName: string,
  queryEmbedding: number[],
  topK: number = 8
) {

  const vector = `[${queryEmbedding.join(",")}]`;

  const result = await pgPool.query(
    `
    SELECT file_path, content
    FROM repo_embeddings
    WHERE repo_name = $1
    ORDER BY embedding <-> $2
    LIMIT $3
    `,
    [repoName, vector, topK]
  );

  return result.rows;
}