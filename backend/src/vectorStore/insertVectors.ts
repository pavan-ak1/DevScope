import { log } from "console";
import { createHash } from "node:crypto";
import { ensureCollection, qdrantClient } from "./qdrantStore.js";
import { fetchRepoFiles } from "../github/fetchRepoFiles.js";
import { chunkFileByFile } from "../chunking/fileChunker.js";
import { embedChunks } from "../embeddings/geminiEmbedder.js";

interface EmbeddedChunk{
    vector:number[];
    text:string;
    metadata:{
      user_id:string;
        file_path:string;
        language:string;
        repo_name:string;
    }
}

function generateDeterministicUUID(input: string): string {
  const hash = createHash("sha256").update(input).digest("hex");
  // Format as UUID: 8-4-4-4-12
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
}

export async function insertVectors(
    collectionName:string,
    embeddedChunks:EmbeddedChunk[]
){

  if(embeddedChunks.length === 0){
    log("No vectors to insert");
    return;
  }
    const vectorSize = embeddedChunks[0].vector.length;

    await ensureCollection(collectionName,vectorSize);

     const points = embeddedChunks.map((chunk, index) => ({
    // ✅ Stable, collision-free UUID
    id: generateDeterministicUUID(`${chunk.metadata.user_id}_${chunk.metadata.file_path}_${index}`),
    vector: chunk.vector,
    payload: {
      text: chunk.text,
      ...chunk.metadata,
    },
  }));

  await qdrantClient.upsert(collectionName,{
    wait:true,
    points,
  });

  log(`Inserted ${points.length} vectors into ${collectionName}`);
}

// const repoUrl = "https://github.com/pavan-ak1/Portfolio"

// const files = await fetchRepoFiles(repoUrl);

// const chunks = chunkFileByFile(files, "Portfolio");

// const embedded = await embedChunks(chunks);

// await insertVectors("portfolio_repo", embedded);