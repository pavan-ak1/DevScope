export function parseRepoName(repoUrl: string) {
  try {
    const parts = repoUrl.split("github.com/")[1].split("/");
    const owner = parts[0];
    const repo = parts[1].replace(".git", "");
    return { owner, repo };
  } catch {
    throw new Error("Invalid GitHub repo URL");
  }
}
