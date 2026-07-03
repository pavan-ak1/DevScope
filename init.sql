CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS repo_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    repo_name TEXT,
    file_path TEXT,
    language TEXT,
    content TEXT,
    embedding VECTOR(1024),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS repo_embedding_index
ON repo_embeddings
USING ivfflat (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS rag_metrics (
  id SERIAL PRIMARY KEY,
  repo_name TEXT,
  question TEXT,
  retrieved_chunks TEXT,
  context_precision FLOAT,
  avg_similarity FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);