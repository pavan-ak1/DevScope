import { log } from "console";
import { ensureCollection, qdrantClient } from "./qdrantStore.js";
import { fetchRepoFiles } from "../github/fetchRepoFiles.js";
import { chunkFileByFile } from "../chunking/fileChunker.js";
import { embedChunks } from "../embeddings/geminiEmbedder.js";

interface EmbeddedChunk{
    vector:number[];
    text:string;
    metadata:{
        file_path:string;
        language:string;
        repo_name:string;
    }
}


export async function insertVectors(
    collectionName:string,
    embeddedChunks:EmbeddedChunk[]
){
    const vectorSize = embeddedChunks[0].vector.length;

    await ensureCollection(collectionName,vectorSize);

     const points = embeddedChunks.map((chunk, index) => ({
    id: index,
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

  log(`Inserted ${points.length} vectors`);
}

const repoUrl = "https://github.com/pavan-ak1/Portfolio"

const files = await fetchRepoFiles(repoUrl);

const chunks = chunkFileByFile(files, "Portfolio");

const embedded = await embedChunks(chunks);

await insertVectors("portfolio_repo", embedded);