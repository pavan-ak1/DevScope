import "../env.js";
import { Worker } from "bullmq";
import { fetchRepoFiles } from "../github/fetchRepoFiles.js";
import { chunkFileByFile } from "../chunking/fileChunker.js";
import { embedChunks } from "../embeddings/geminiEmbedder.js";
import { insertVectors } from "../vectorStore/insertVectors.js";
import { redis } from "../queue/redis.js";
import { QueueEvents } from "bullmq";
import { parseRepoName } from "../utils/parseRepoName.js";



new Worker(
  "repo-ingestion",
  async (job) => {
    const { repoUrl, userId, collectionName } = job.data;

    if (!repoUrl) {
      throw new Error("repoUrl missing in job data");
    }

    if (!userId) {
      throw new Error("userId missing in job data");
    }

    if (!collectionName) {
      throw new Error("collectionName missing in job data");
    }

    const repoName = parseRepoName(repoUrl);



    await job.updateProgress(10);

    const files = await fetchRepoFiles(repoUrl);
    await job.updateProgress(30);

    const chunks = chunkFileByFile(files, repoName, userId);
    await job.updateProgress(50);

    const embedded = await embedChunks(chunks);
    await job.updateProgress(80);

    await insertVectors(collectionName, embedded);
    await job.updateProgress(100);
  },
  { connection: redis }
);


new QueueEvents("repo-ingestion", {
  connection: redis,
}).on("completed", ({ jobId }) => {
  console.log(`Job ${jobId} completed`);
});
