CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS repo_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    repo_name TEXT,
    file_path TEXT,
    language TEXT,
    content TEXT,
    embedding VECTOR(1024),
    search_vector TSVECTOR,
    created_at TIMESTAMP DEFAULT NOW()
);

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

-- CREATE INDEX IF NOT EXISTS repo_embedding_cosine_idx
-- ON repo_embeddings
-- USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS repo_embeddings_search_vector_idx 
ON repo_embeddings
USING gin(search_vector);

CREATE TABLE IF NOT EXISTS rag_metrics (
  id SERIAL PRIMARY KEY,
  repo_name TEXT,
  question TEXT,
  retrieved_chunks TEXT,
  context_precision FLOAT,
  avg_similarity FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);