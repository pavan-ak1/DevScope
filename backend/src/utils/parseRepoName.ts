export function parseRepoName(repoUrl: string): string {
  if (!repoUrl) {
    throw new Error("repoUrl is required");
  }

  // Split URL and remove empty segments
  const parts = repoUrl.split("/").filter(Boolean);

  // Last part should be the repo name
  const rawRepoName = parts[parts.length - 1];

  if (!rawRepoName) {
    throw new Error("Invalid GitHub repository URL");
  }

  // Normalize:
  // - lowercase
  // - replace unsafe characters with underscore
  // - trim underscores
  return rawRepoName
    .toLowerCase()
    .replace(/\.git$/, "")          // remove .git if present
    .replace(/[^a-z0-9-_]/g, "_")   // Qdrant-safe
    .replace(/_+/g, "_")            // collapse multiple underscores
    .replace(/^_+|_+$/g, "");       // trim edges
}