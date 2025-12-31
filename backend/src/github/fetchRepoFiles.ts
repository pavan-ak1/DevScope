import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/**
 * Represents a fetched source file
 */
export interface RepoFile {
  path: string;
  content: string;
}

/**
 * Safely parse GitHub repo URL
 * Supports:
 *  - https://github.com/owner/repo
 *  - https://github.com/owner/repo.git
 */
function parseRepoUrl(repoUrl: string) {
  const cleanUrl = repoUrl.replace(".git", "").replace(/\/$/, "");
  const parts = cleanUrl.split("/");

  const owner = parts[3];
  const repo = parts[4];

  if (!owner || !repo) {
    throw new Error("Invalid GitHub repository URL");
  }

  return { owner, repo };
}

/**
 * Fetch source files from a GitHub repository using Trees API
 */
export async function fetchRepoFiles(repoUrl: string): Promise<RepoFile[]> {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is missing");
  }

  const { owner, repo } = parseRepoUrl(repoUrl);

  // GitHub API client
  const github = axios.create({
    baseURL: "https://api.github.com",
    headers: {
      "User-Agent": "repo-explainer-rag",
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    },
  });

  // 1️⃣ Get repository metadata → default branch
  const repoRes = await github.get(`/repos/${owner}/${repo}`);
  const defaultBranch = repoRes.data.default_branch;

  console.log("Default branch:", defaultBranch);

  // 2️⃣ Get full file tree (recursive)
  const treeRes = await github.get(
    `/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`
  );

  const tree = treeRes.data.tree as Array<{
    path: string;
    type: string;
    size?: number;
    url: string;
  }>;

  console.log(
  "Total files in repo:",
  tree.filter(f => f.type === "blob").length
);

console.log(
  "Sample paths:",
  tree
    .filter(f => f.type === "blob")
    .slice(0, 10)
    .map(f => f.path)
);


  // 3️⃣ Filter allowed files
  const allowedFiles = tree.filter((file) => {
    if (file.type !== "blob") return false;
    if (!file.size || file.size > 200_000) return false;

    // Exclusions
    if (
      file.path.includes("node_modules") ||
      file.path.includes("dist") ||
      file.path.includes("build") ||
      file.path.endsWith(".lock") ||
      file.path.includes(".env")
    ) {
      return false;
    }

    // Inclusions
    // Inclusions (code & config files)
return (
  file.path === "README.md" ||
  file.path.endsWith(".ts") ||
  file.path.endsWith(".js") ||
  file.path.endsWith(".tsx") ||
  file.path.endsWith(".jsx") ||
  file.path.endsWith(".json")
);

  });

  // 4️⃣ Download file contents
  const files: RepoFile[] = [];

  for (const file of allowedFiles) {
    const blobRes = await github.get(file.url);

    const content = Buffer.from(
      blobRes.data.content,
      "base64"
    ).toString("utf-8");

    files.push({
      path: file.path,
      content,
    });
  }

  return files;
}

// /* ------------------ TEST ------------------ */

// const files = await fetchRepoFiles(
//   "https://github.com/pavan-ak1/Portfolio"
// );

// console.log("Files fetched:", files.length);
// if (files.length === 0) {
//   console.log("No files matched ingestion rules");
// } else {
//   console.log(files[0].path);
//   console.log(files[0].content);
// }

