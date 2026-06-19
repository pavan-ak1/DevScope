import { Worker } from "bullmq";
import { redis } from "../queue/redis.js";
import { contextPrecision } from "../testRetrival/contextPrecision.js";
import { pgPool } from "../vectorStore/pgClient.js";

new Worker(
  "rag-metrics",
  async job => {
    try {

      const { repoName, question, context, answer } = job.data;

      const retrievedChunks = context.map((c: any) => c.content);

      const precision = await contextPrecision(
        retrievedChunks,
        answer
      );

      const avgSimilarity =
        context.reduce((sum: any, c: any) => sum + (c.score || 0), 0) /
        context.length;

      await pgPool.query(
        `INSERT INTO rag_metrics
        (repo_name, question, retrieved_chunks, context_precision, avg_similarity)
        VALUES ($1,$2,$3,$4,$5)`,
        [
          repoName,
          question,
          JSON.stringify(context),
          precision,
          avgSimilarity
        ]
      );

      return { success: true };

    } catch (err) {

      console.error(" Metrics job failed:", err);

      throw err;
    }
  },
  { connection: redis }
);
