import { Worker } from "bullmq";
import { log } from "node:console";
import { fetchRepoFiles } from "../github/fetchRepoFiles.js";
import { chunkFileByFile } from "../chunking/fileChunker.js";
import { embedChunks } from "../embeddings/geminiEmbedder.js";
import { insertVectors } from "../vectorStore/insertVectors.js";
import { redis } from "../queue/redis.js";
import { QueueEvents } from "bullmq";



new Worker(
  "repo-ingestion",
  async (job) => {
    const { repoUrl, repoName } = job.data;

    await job.updateProgress(10);

    const files = await fetchRepoFiles(repoUrl);
    await job.updateProgress(30);

    const chunks = chunkFileByFile(files, repoName);
    await job.updateProgress(50);

    const embedded = await embedChunks(chunks);
    await job.updateProgress(80);

    await insertVectors(repoName, embedded);
    await job.updateProgress(100);
  },
  { connection: redis }
);


new QueueEvents("repo-ingestion", {
  connection: redis,
}).on("completed", ({ jobId }) => {
  console.log(`Job ${jobId} completed`);
});
