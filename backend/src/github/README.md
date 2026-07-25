# GitHub Ingestion: `fetchRepoFiles.ts`

This module is responsible for **downloading the source code files of a GitHub repository** so they can be chunked, embedded, and stored in a vector database for semantic search.

In the **DevScope** pipeline, this is the **first step of ingestion**.

```
GitHub Repo
     ↓
fetchRepoFiles()   ← THIS CODE (Fetches, filters, and decodes files)
     ↓
chunkFileByFile()  (LangChain syntax splitter)
     ↓
Generate Embeddings (Mistral Embeddings API)
     ↓
Store in pgvector   (PostgreSQL database)
```

---

## 🛠️ Step-by-Step Explanation of the Implementation

### 1. File Type Definition (`RepoFile`)
The returned results are structured as objects fitting the following type:
```ts
type RepoFile = {
  path: string;      // The relative file path in the repository
  content: string;   // The decoded UTF-8 source code content
  language: string;  // The parsed programming language name
};
```

---

### 2. Language Detection (`detectLanguage`)
The system maps file extensions to language identifiers to assist the downstream recursive code splitter.

```ts
function detectLanguage(path: string)
```

It extracts the file extension (e.g. `src/index.ts` → `ts`) and references a hardcoded lookup map:
- `ts`/`tsx` → `typescript`
- `js`/`jsx`/`mjs`/`cjs` → `javascript`
- `py` → `python`
- `go` → `go`
- `rs` → `rust`
- `cpp`/`cc`/`cxx`/`h`/`hpp` → `cpp`
- `java` → `java`
- `kt`/`kts` → `kotlin`
- `sh`/`bash`/`zsh` → `shell`
- `sql` → `sql`
- `dockerfile` → `dockerfile`
- *(Defaults to `text` for unrecognized files)*

---

### 3. GitHub API Request with Token Authorization
The module reads `GITHUB_TOKEN` from environment variables to authenticate with GitHub. This prevents hitting API rate limits during ingestion of large repositories:

```ts
const headers = env.GITHUB_TOKEN ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` } : {};

const treeRes = await axios.get(
  `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
  { headers }
);
```

The Git Trees API is queried with `recursive=1` to return all files and directories in the repository at the `HEAD` reference in a single request.

---

### 4. Code File & Path Filtering
We filter the returned tree elements (`blobsToFetch`) to only target files containing meaningful code.

#### A. Ignoring Directories
Directories, symlinks, and files situated in standard build, package, or dependency paths are skipped. We split each file path (e.g., `node_modules/axios/index.js` → `["node_modules", "axios", "index.js"]`) and ignore the file if any segment is a dotfile/dotfolder or is in our exclusion list:
- `node_modules`, `dist`, `build`, `public`, `static`, `vendor`, `bower_components`, `assets`, `coverage`, `temp`, `tmp`

#### B. Ignoring Lockfiles & Bundles
Lockfiles and minified assets are skipped:
- `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `bun.lockb`
- `.min.js`, `.min.css`, `.bundle.`

#### C. Allowed Code Extensions
To keep our search focused on code, we restrict files to a set of code-specific extensions:
`ts`, `tsx`, `js`, `jsx`, `mjs`, `cjs`, `py`, `java`, `kt`, `kts`, `scala`, `go`, `rs`, `cpp`, `cc`, `cxx`, `h`, `hpp`, `c`, `cs`, `rb`, `php`, `swift`, `sol`, `proto`, `sh`, `bash`, `zsh`, `sql`, `dockerfile`

---

### 5. Concurrent Fetching with Batch Limits
Instead of downloading files sequentially or fetching them all simultaneously (which causes network congestion or API rate limit failures), files are retrieved in **batches of 5 (concurrency limit)**:

```ts
const concurrencyLimit = 5;
for (let i = 0; i < blobsToFetch.length; i += concurrencyLimit) {
  const chunk = blobsToFetch.slice(i, i + concurrencyLimit);
  await Promise.all(
    chunk.map(async (item: any) => {
      const fileRes = await axios.get(item.url, { headers });
      const content = Buffer.from(fileRes.data.content, "base64").toString("utf8");

      files.push({
        path: item.path,
        content,
        language: detectLanguage(item.path)
      });
    })
  );
}
```

- Each file payload is fetched as a Git blob from `item.url`.
- GitHub's blob payload contains content encoded in `base64`.
- The content is decoded back into `utf8` before saving to the files array.

---

## 🚀 Key Advantages of This Implementation
- **Rate-Limit Safe:** Includes support for Github Personal Access Tokens and limits requests to a maximum concurrency of 5.
- **Noise Reduction:** Filters out build directories (`dist/`, `build/`), dependency folders (`node_modules/`), and heavy lockfiles.
- **Language Aware:** Auto-assigns file languages to facilitate syntax-based character splitting in the next stages.
