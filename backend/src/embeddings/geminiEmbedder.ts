import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { chunkFileByFile, type FileChunk } from "../chunking/fileChunker.js";
import { fetchRepoFiles } from "../github/fetchRepoFiles.js";

export const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "text-embedding-004",
  apiKey: process.env.GEMINI_API_KEY,
});

export async function embedChunks(chunks: FileChunk[]) {
  const texts = chunks.map((chunk) => chunk.pageContent);

  const vectors = await embeddings.embedDocuments(texts);

  return vectors.map((vector, index) => ({
    vector,
    metadata: chunks[index].metadata,
    text: chunks[index].pageContent,
  }));
}


//test
// const repoUrl = "https://github.com/pavan-ak1/Portfolio";

// const files = await fetchRepoFiles(repoUrl);
// const chunks = chunkFileByFile(files, "Portfolio");

// const embedded = await embedChunks(chunks);

// console.log("Total vectors:", embedded.length);
// console.log("Vector dimension:", embedded[0].vector.length);
// console.log("Sample metadata:", embedded[0].metadata);
