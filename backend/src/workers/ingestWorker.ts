import { Worker } from "bullmq";
import { redis } from "../queue/redis.js";
import { parseRepoName } from "../utils/parseRepoName.js";
import { fetchRepoFiles } from "../github/fetchRepoFiles.js";
import { chunkFileByFile } from "../chunking/fileChunker.js";
import { embedChunks } from "../embeddings/geminiEmbedder.js";
import { insertVectors } from "../vectorStore/insertVectors.js";

new Worker(
  "repo-ingest",
  async job => {

    const { repoUrl, repoName } = job.data;

    const { owner, repo } = parseRepoName(repoUrl);

    const files = await fetchRepoFiles(owner, repo);
    await job.updateProgress(20);

    const chunks = await chunkFileByFile(files);
    await job.updateProgress(40);

    const embeddings = await embedChunks(
      chunks.map(c => c.content)
    );
    await job.updateProgress(80);

    const records = [];

for (let i = 0; i < chunks.length; i++) {

  const emb = embeddings[i];

  if (!emb || emb.length === 0) {
    console.warn("Skipping empty embedding");
    continue;
  }

  records.push({
    repoName,
    filePath: chunks[i].filePath,
    language: chunks[i].language,
    content: chunks[i].content,
    embedding: emb
  });
}
console.log("Chunks:", chunks.length);
console.log("Embeddings:", embeddings.length);

    await insertVectors(records);
    await job.updateProgress(100);

    return { success: true };
  },
  { connection: redis }
);