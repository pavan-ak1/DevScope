import express, { Request, Response } from "express";
import { ingestQueue } from "./queue/queues.js";
import { answerQuestion } from "./llm/answerQuestion.js";
import { env } from "./env.js";
import { metricsQueue } from "./queue/metricQueue.js";
import cors from "cors";
import { pgPool } from "./vectorStore/pgClient.js";

import "./workers/ingestWorker.js";
import "./workers/metricsWorker.js";

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    if (isLocalhost || origin === env.FRONTEND_URL) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/ingest", async (req, res) => {
  try {
    const { repoUrl, repoName } = req.body;

    const job = await ingestQueue.add("ingest", {
      repoUrl,
      repoName
    });

    res.json({
      jobId: job.id
    });
  } catch {
    res.status(500).json({
      error: "Failed to enqueue ingestion"
    });
  }
});

app.post("/ask", async (req, res) => {
  try {
    const { repoName, question, filter } = req.body;

    const result = await answerQuestion(repoName, question, filter);

    await metricsQueue.add("evaluate", {
      repoName,
      question,
      context: result.context,
      answer: result.answer
    })

    res.json({
      question,
      context: result.context,
      answer: result.answer
    });

  } catch (err) {
    console.error("ASK API ERROR:", err);

    res.status(500).json({
      error: "Failed to answer question"
    });
  }
});

app.get("/repositories", async (req: Request, res: Response) => {
  try {
    const repositories = await pgPool.query(`
      SELECT 
        e.repo_name as name, 
        MAX(e.created_at) as ingested_at,
        COALESCE(m.avg_precision, 0) as avg_precision,
        COALESCE(m.avg_similarity, 0) as avg_similarity,
        COALESCE(m.total_queries, 0) as total_queries
      FROM repo_embeddings e
      LEFT JOIN (
        SELECT 
          repo_name,
          AVG(context_precision) as avg_precision,
          AVG(avg_similarity) as avg_similarity,
          COUNT(*)::INTEGER as total_queries
        FROM rag_metrics
        GROUP BY repo_name
      ) m ON e.repo_name = m.repo_name
      GROUP BY e.repo_name, m.avg_precision, m.avg_similarity, m.total_queries
    `);
    res.json(repositories.rows.map(row => ({
      name: row.name,
      ingestedAt: row.ingested_at,
      avgPrecision: parseFloat(row.avg_precision),
      avgSimilarity: parseFloat(row.avg_similarity),
      totalQueries: parseInt(row.total_queries)
    })));
  } catch (err) {

    console.error("GET REPOSITORIES ERROR:", err);
    res.status(500).json({
      error: "Failed to get repositories"
    });
  }
});

app.delete("/repositories/:repoName", async (req: Request, res: Response) => {
  const { repoName } = req.params;
  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM repo_embeddings WHERE repo_name = $1", [repoName]);
    await client.query("DELETE FROM rag_metrics WHERE repo_name = $1", [repoName]);
    await client.query("COMMIT");
    res.json({ success: true, message: `Repository ${repoName} deleted successfully` });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("DELETE REPOSITORY ERROR:", err);
    res.status(500).json({ error: "Failed to delete repository" });
  } finally {
    client.release();
  }
});

app.get("/metrics/:repoName", async (req: Request, res: Response) => {
  const { repoName } = req.params;
  try {
    const result = await pgPool.query(
      `SELECT 
        COALESCE(AVG(context_precision), 0) as avg_precision,
        COALESCE(AVG(avg_similarity), 0) as avg_similarity,
        COUNT(*)::INTEGER as total_queries
      FROM rag_metrics
      WHERE repo_name = $1`,
      [repoName]
    );

    if (result.rows.length === 0) {
      return res.json({
        avgPrecision: 0,
        avgSimilarity: 0,
        totalQueries: 0
      });
    }

    const row = result.rows[0];
    res.json({
      avgPrecision: parseFloat(row.avg_precision),
      avgSimilarity: parseFloat(row.avg_similarity),
      totalQueries: row.total_queries
    });
  } catch (err) {
    console.error("GET METRICS ERROR:", err);
    res.status(500).json({ error: "Failed to get repository metrics" });
  }
});


app.get("/status/:jobId", async (req, res) => {
  try {
    const job = await ingestQueue.getJob(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        error: "Job not found"
      });
    }

    const state = await job.getState();

    res.json({
      status: state,
      progress: job.progress,
      failedReason: job.failedReason
    });
  } catch {
    res.status(500).json({
      error: "Failed to get job status"
    });
  }
});

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});