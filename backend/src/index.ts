import express from "express";
import { ingestQueue } from "./queue/queues.js";
import { answerQuestion } from "./llm/answerQuestion.js";


const app = express();
app.use(express.json());

/**
 * Trigger repo ingestion (ASYNC)
 */
app.post("/ingest", async (req, res) => {
  const { repoUrl, repoName } = req.body;

  const job = await ingestQueue.add("INGEST_REPO", {
  repoUrl,
  repoName,
});

  res.json({
    jobId: job.id,
    status: "queued",
    message: "Repository ingestion started",
  });
});

/**
 * Ask questions (SYNC)
 */
app.post("/ask", async (req, res) => {
  const { repoName, question } = req.body;

  const answer = await answerQuestion(repoName, question);

  res.json({ answer });
});

/**
 * Check ingestion job status
 */
app.get("/status/:jobId", async (req, res) => {
  const { jobId } = req.params;

  const job = await ingestQueue.getJob(jobId);

  if (!job) {
    return res.status(404).json({
      error: "Job not found",
    });
  }

  const state = await job.getState();

  res.json({
    jobId,
    status: state, // waiting | active | completed | failed
    progress: job.progress,
    failedReason: job.failedReason || null,
  });
});


app.listen(3000, () => {
  console.log("Server running on port 3000");
});
