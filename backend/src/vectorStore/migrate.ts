import { pgPool } from "./pgClient.js";

async function runMigration() {
  console.log("Starting database migration...");
  const client = await pgPool.connect();

  try {
    console.log("Dropping existing repo_embeddings table if exists...");
    await client.query("DROP TABLE IF EXISTS repo_embeddings;");

    console.log("Creating new repo_embeddings table with VECTOR(1024)...");
    await client.query(`
      CREATE TABLE repo_embeddings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        repo_name TEXT,
        file_path TEXT,
        language TEXT,
        content TEXT,
        embedding VECTOR(1024),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("Creating vector index on repo_embeddings...");
    await client.query(`
      CREATE INDEX repo_embedding_index
      ON repo_embeddings
      USING ivfflat (embedding vector_cosine_ops);
    `);

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    client.release();
    await pgPool.end();
  }
}

runMigration();
