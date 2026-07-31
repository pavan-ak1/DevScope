import { pgPool } from "../vectorStore/pgClient.js";

export interface ChunkResult {
    id: string;
    file_path: string;
    content: string;
    score: number;
}

interface DBResult {
    id: string;
    file_path: string;
    content: string;
}

/**
 * Perform hybrid search combining dense pgvector search and sparse full-text search.
 * Merges results using Reciprocal Rank Fusion (RRF).
 */
export async function hybridSearch(
    repoName: string,
    query: string,
    queryEmbedding: number[],
    topK: number = 8,
    k: number = 60,
    filter?: string
): Promise<ChunkResult[]> {
    const vectorStr = `[${queryEmbedding.join(",")}]`;

    let filterSql = "";
    if (filter === "backend") {
        filterSql = "AND (file_path LIKE '%.md' OR file_path LIKE '%.mdx' OR file_path ILIKE '%readme%' OR (file_path NOT LIKE 'frontend/%' AND file_path NOT LIKE '%.tsx' AND file_path NOT LIKE '%.jsx' AND file_path NOT LIKE '%.html' AND file_path NOT LIKE '%.css'))";
    } else if (filter === "frontend") {
        filterSql = "AND (file_path LIKE 'frontend/%' OR file_path LIKE '%.tsx' OR file_path LIKE '%.jsx' OR file_path LIKE '%.html' OR file_path LIKE '%.css')";
    }

    // 1. Run Vector Search and FTS in parallel (retrieving top 20 from each)
    const [vectorRes, ftsRes] = await Promise.all([
        pgPool.query<DBResult>(
            `
      SELECT id, file_path, content
      FROM repo_embeddings
      WHERE repo_name = $1 ${filterSql}
      ORDER BY embedding <=> $2
      LIMIT 20
      `,
            [repoName, vectorStr]
        ),
        pgPool.query<DBResult>(
            `
      SELECT id, file_path, content
      FROM repo_embeddings, websearch_to_tsquery('english', $2) query
      WHERE repo_name = $1 AND search_vector @@ query ${filterSql}
      ORDER BY ts_rank_cd(search_vector, query) DESC
      LIMIT 20
      `,
            [repoName, query]
        )
    ]);

    const vectorRows = vectorRes.rows;
    const ftsRows = ftsRes.rows;

    // 2. Compute Reciprocal Rank Fusion (RRF)
    const rrfScores: Record<string, { doc: DBResult; rrfScore: number }> = {};

    // Rank Vector Results (1-indexed rank)
    vectorRows.forEach((doc, index) => {
        const rank = index + 1;
        if (!rrfScores[doc.id]) {
            rrfScores[doc.id] = { doc, rrfScore: 0 };
        }
        rrfScores[doc.id].rrfScore += 1 / (k + rank);
    });

    // Rank FTS Results (1-indexed rank)
    ftsRows.forEach((doc, index) => {
        const rank = index + 1;
        if (!rrfScores[doc.id]) {
            rrfScores[doc.id] = { doc, rrfScore: 0 };
        }
        rrfScores[doc.id].rrfScore += 1 / (k + rank);
    });

    // 3. Sort by RRF score descending and return the top K
    return Object.values(rrfScores)
        .sort((a, b) => b.rrfScore - a.rrfScore)
        .slice(0, topK)
        .map(item => ({
            id: item.doc.id,
            file_path: item.doc.file_path,
            content: item.doc.content,
            score: item.rrfScore
        }));
}
