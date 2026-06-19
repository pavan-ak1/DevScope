import { pgPool } from "./pgClient.js";

type VectorRecord = {
  repoName: string;
  filePath: string;
  language: string;
  content: string;
  embedding: number[];
};

export async function insertVectors(records: VectorRecord[]) {
  const client = await pgPool.connect();

  try {
    await client.query("BEGIN");

    for (const r of records) {
      const vector = `[${r.embedding.join(",")}]`;

      await client.query(
        `
        INSERT INTO repo_embeddings
        (repo_name, file_path, language, content, embedding)
        VALUES ($1,$2,$3,$4,$5)
        `,
        [
          r.repoName,
          r.filePath,
          r.language,
          r.content,
          vector
        ]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}