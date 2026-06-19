CREATE TABLE rag_metrics (
  id SERIAL PRIMARY KEY,
  repo_name TEXT,
  question TEXT,
  context_precision FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

