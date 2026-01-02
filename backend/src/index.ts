import "./env.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import express from "express";
import cookieParser from "cookie-parser";

import { connectDB } from "./db/connectDb.js";
import { authMiddleware } from "./auth/authMiddleware.js";
import type {AuthenticatedRequest} from "./auth/authMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import { ingestQueue } from "./queue/queues.js";
import { answerQuestion } from "./llm/answerQuestion.js";

const app = express();

// ---------- Global Middleware ----------
app.use(express.json());
app.use(cookieParser());

// ---------- Auth Routes ----------
app.use("/auth", authRoutes);

// ---------- Protected Routes ----------

/**
 * Trigger repo ingestion (ASYNC)
 */
app.post(
  "/ingest",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    const { repoUrl, repoName } = req.body;
    const userId = req.user!.userId;

    if (!repoUrl || !repoName) {
      return res.status(400).json({
        error: "repoUrl and repoName are required",
      });
    }

    const collectionName = `${userId}_${repoName}`;

    const job = await ingestQueue.add("INGEST_REPO", {
      repoUrl,
      repoName,
      collectionName,
      userId,
    });

    res.json({
      jobId: job.id,
      status: "queued",
      message: "Repository ingestion started",
    });
  }
);

/**
 * Ask questions (SYNC)
 */
app.post(
  "/ask",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    const { repoName, question } = req.body;
    const userId = req.user!.userId;

    if (!repoName || !question) {
      return res.status(400).json({
        error: "repoName and question are required",
      });
    }

    const collectionName = `${userId}_${repoName}`;

    const answer = await answerQuestion(
      collectionName,
      question,
      userId
    );

    res.json({ answer });
  }
);

/**
 * Check ingestion job status
 */
app.get(
  "/status/:jobId",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    const { jobId } = req.params;
    const userId = req.user!.userId;

    const job = await ingestQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        error: "Job not found",
      });
    }

    // 🔐 Optional ownership check (recommended)
    if (job.data.userId !== userId) {
      return res.status(403).json({
        error: "Access denied",
      });
    }

    const state = await job.getState();

    res.json({
      jobId,
      status: state,
      progress: job.progress,
      failedReason: job.failedReason || null,
    });
  }
);

// ---------- Server Bootstrap ----------
const PORT = 3000;

async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer();
