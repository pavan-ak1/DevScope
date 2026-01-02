import axios from "axios";

/**
 * Represents a fetched source file
 */
export interface RepoFile {
  path: string;
  content: string;
}

/**
 * Safely parse GitHub repo URL.
 * Supports:
 *  - https://github.com/owner/repo
 *  - https://github.com/owner/repo.git
 */
function parseRepoUrl(repoUrl: string) {
  if (!repoUrl) {
    throw new Error("repoUrl is required");
  }

  const cleanUrl = repoUrl.replace(/\.git$/, "").replace(/\/$/, "");
  const parts = cleanUrl.split("/").filter(Boolean);

  const repo = parts[parts.length - 1];
  const owner = parts[parts.length - 2];

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

  const github = axios.create({
    baseURL: "https://api.github.com",
    headers: {
      "User-Agent": "repo-explainer-rag",
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    },
  });

  // 1️⃣ Get default branch
  const repoRes = await github.get(`/repos/${owner}/${repo}`);
  const defaultBranch = repoRes.data.default_branch;

  console.log("[fetchRepoFiles] Default branch:", defaultBranch);

  // 2️⃣ Fetch full tree
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
    "[fetchRepoFiles] Total blobs:",
    tree.filter((f) => f.type === "blob").length
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

    // Inclusions (code + docs)
    return (
      file.path === "README.md" ||
      file.path.endsWith(".ts") ||
      file.path.endsWith(".js") ||
      file.path.endsWith(".tsx") ||
      file.path.endsWith(".jsx") ||
      file.path.endsWith(".json")
    );
  });

  // 4️⃣ Download file contents (sequential by design to avoid API abuse)
  const files: RepoFile[] = [];

  for (const file of allowedFiles) {
    const blobRes = await github.get(file.url);

    if (!blobRes.data?.content) {
      continue; // safety guard
    }

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
