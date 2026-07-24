import axios from "axios";
import { env } from "../env.js";

type RepoFile = {
  path: string;
  content: string;
  language: string;
};

function detectLanguage(path: string) {
  const ext = (path.split(".").pop() || "").toLowerCase();

  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    py: "python",
    java: "java",
    kt: "kotlin",
    kts: "kotlin",
    scala: "scala",
    go: "go",
    rs: "rust",
    cpp: "cpp",
    cc: "cpp",
    cxx: "cpp",
    h: "cpp",
    hpp: "cpp",
    c: "c",
    cs: "csharp",
    rb: "ruby",
    php: "php",
    swift: "swift",
    sol: "solidity",
    proto: "protobuf",
    sh: "shell",
    bash: "shell",
    zsh: "shell",
    sql: "sql",
    html: "html",
    htm: "html",
    css: "css",
    scss: "css",
    sass: "css",
    md: "markdown",
    mdx: "markdown",
    rst: "rst",
    txt: "text",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    xml: "xml",
    ini: "ini",
    conf: "config",
    config: "config",
    dockerfile: "dockerfile"
  };

  return map[ext] || "text";
}

export async function fetchRepoFiles(
  owner: string,
  repo: string
): Promise<RepoFile[]> {
  const files: RepoFile[] = [];

  const headers = env.GITHUB_TOKEN ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` } : {};

  const treeRes = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
    { headers }
  );

  const tree = treeRes.data.tree;

  const allowedExtensions = [
    "ts", "tsx", "js", "jsx", "mjs", "cjs",
    "py",
    "java", "kt", "kts", "scala",
    "go",
    "rs",
    "cpp", "cc", "cxx", "h", "hpp", "c",
    "cs",
    "rb",
    "php",
    "swift",
    "sol",
    "proto",
    "sh", "bash", "zsh",
    "sql",
    "dockerfile"
  ];
  const blobsToFetch = tree.filter((item: any) => {
    if (item.type !== "blob") return false;
    const pathParts = item.path.split("/");
    const ignoredDirectories = [
      "node_modules",
      "dist",
      "build",
      "public",
      "static",
      "vendor",
      "bower_components",
      "assets",
      "coverage",
      "temp",
      "tmp"
    ];

    const hasIgnoredDir = pathParts.some((part: string) => {
      const lowerPart = part.toLowerCase();
      return ignoredDirectories.includes(lowerPart) || lowerPart.startsWith(".");
    });

    if (hasIgnoredDir) {
      return false;
    }

    // Ignore lockfiles to prevent unnecessary ingestion
    const filename = item.path.split("/").pop() || "";
    if (
      filename === "package-lock.json" ||
      filename === "yarn.lock" ||
      filename === "pnpm-lock.yaml" ||
      filename === "bun.lockb" ||
      filename.endsWith(".min.js") ||
      filename.endsWith(".min.css") ||
      filename.includes(".bundle.")
    ) {
      return false;
    }

    const ext = (item.path.split(".").pop() || "").toLowerCase();
    return allowedExtensions.includes(ext);
  });

  const concurrencyLimit = 5;
  for (let i = 0; i < blobsToFetch.length; i += concurrencyLimit) {
    const chunk = blobsToFetch.slice(i, i + concurrencyLimit);
    await Promise.all(
      chunk.map(async (item: any) => {
        try {
          const fileRes = await axios.get(item.url, { headers });
          const content = Buffer.from(
            fileRes.data.content,
            "base64"
          ).toString("utf8");

          files.push({
            path: item.path,
            content,
            language: detectLanguage(item.path)
          });
        } catch (error: any) {
          console.error(`Error fetching file content for ${item.path}:`, error.message || error);
        }
      })
    );
  }


  return files;
}