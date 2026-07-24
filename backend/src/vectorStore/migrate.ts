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
        search_vector TSVECTOR,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("Creating trigger function and trigger for FTS...");
    await client.query(`
      CREATE OR REPLACE FUNCTION repo_embeddings_trigger_func() 
      RETURNS trigger AS $$
      BEGIN
        NEW.search_vector := 
          setweight(to_tsvector('english', COALESCE(NEW.file_path, '')), 'A') ||
          setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B');
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER tsvectorupdate 
        BEFORE INSERT OR UPDATE ON repo_embeddings
        FOR EACH ROW 
        EXECUTE FUNCTION repo_embeddings_trigger_func();
    `);

    /*
    console.log("Creating vector index on repo_embeddings...");
    await client.query(`
      CREATE INDEX repo_embedding_cosine_idx
      ON repo_embeddings
      USING ivfflat (embedding vector_cosine_ops);
    `);
    */

    console.log("Creating GIN search_vector index on repo_embeddings...");
    await client.query(`
      CREATE INDEX repo_embeddings_search_vector_idx
      ON repo_embeddings
      USING gin(search_vector);
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
