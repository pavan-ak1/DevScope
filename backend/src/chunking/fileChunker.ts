import { RecursiveCharacterTextSplitter, SupportedTextSplitterLanguage } from "@langchain/textsplitters";

type RepoFile = {
  path: string;
  content: string;
  language: string;
};

export type FileChunk = {
  filePath: string;
  language: string;
  content: string;
};

function mapLanguage(lang: string): SupportedTextSplitterLanguage | null {
  const normalized = lang.toLowerCase().trim();
  switch (normalized) {
    case "js":
    case "javascript":
    case "ts":
    case "typescript":
    case "jsx":
    case "tsx":
    case "mjs":
    case "cjs":
      return "js";
    case "py":
    case "python":
      return "python";
    case "go":
    case "golang":
      return "go";
    case "cpp":
    case "c++":
    case "c":
    case "cc":
    case "cxx":
      return "cpp";
    case "java":
      return "java";
    case "rust":
    case "rs":
      return "rust";
    case "php":
      return "php";
    case "ruby":
    case "rb":
      return "ruby";
    case "scala":
      return "scala";
    case "swift":
      return "swift";
    case "markdown":
    case "md":
    case "mdx":
      return "markdown";
    case "html":
    case "htm":
      return "html";
    case "rst":
      return "rst";
    case "proto":
    case "protobuf":
      return "proto";
    case "latex":
    case "tex":
      return "latex";
    case "sol":
    case "solidity":
      return "sol";
    default:
      return null;
  }
}

export async function chunkFileByFile(files: RepoFile[]): Promise<FileChunk[]> {
  const chunks: FileChunk[] = [];

  const targetChunkSize = 1500;
  const targetOverlap = 300;

  for (const file of files) {
    if (!file.content || file.content.trim() === "") {
      continue;
    }

    const mappedLang = mapLanguage(file.language);
    let splitter: RecursiveCharacterTextSplitter;

    if (mappedLang) {
      splitter = RecursiveCharacterTextSplitter.fromLanguage(mappedLang, {
        chunkSize: targetChunkSize,
        chunkOverlap: targetOverlap,
      });
    } else {
      splitter = new RecursiveCharacterTextSplitter({
        chunkSize: targetChunkSize,
        chunkOverlap: targetOverlap,
      });
    }

    try {
      const splitTexts = await splitter.splitText(file.content);
      for (const text of splitTexts) {
        chunks.push({
          filePath: file.path,
          language: file.language,
          content: text,
        });
      }
    } catch (err) {
      console.error(`Error chunking file ${file.path}:`, err);
      chunks.push({
        filePath: file.path,
        language: file.language,
        content: file.content,
      });
    }
  }

  return chunks;
}


