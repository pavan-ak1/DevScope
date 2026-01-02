import { fetchRepoFiles, type RepoFile } from "../github/fetchRepoFiles.js";

export interface FileChunk {
  pageContent: string;
  metadata: {
    user_id:string;
    file_path: string;
    language: string;
    repo_name: string;
  };
}

function inferLanguage(filePath: string): string {
  if (filePath.endsWith(".ts")) return "typescript";
  if (filePath.endsWith(".js")) return "javascript";
  if (filePath.endsWith(".tsx")) return "typescript-react";
  if (filePath.endsWith(".jsx")) return "javascript-react";
  if (filePath.endsWith(".json")) return "json";
  if (filePath.endsWith(".md")) return "markdown";
  return "text";
}

export function chunkFileByFile(
  files: RepoFile[],
  repoName: string,
  userId:string
): FileChunk[] {
  return files.map((file) => ({
    pageContent: file.content,
    metadata: {
      user_id:userId,
      file_path: file.path,
      language: inferLanguage(file.path),
      repo_name: repoName,
    },
  }));
}

