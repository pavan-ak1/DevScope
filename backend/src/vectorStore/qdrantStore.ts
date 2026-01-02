import { QdrantClient } from "@qdrant/js-client-rest";

export const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
});

export async function ensureCollection(
  collectionName: string,
  vectorSize: number
) {
  try {
    const collections = await qdrantClient.getCollections();
    const exists = collections.collections.some(
      (c) => c.name === collectionName
    );

    if (!exists) {
      await qdrantClient.createCollection(collectionName, {
        vectors: {
          size: vectorSize,
          distance: "Cosine",
        },
      });

      // 🔍 Create index for user isolation
      await qdrantClient.createPayloadIndex(collectionName, {
        field_name: "user_id",
        field_schema: "keyword",
      });

      console.log(`Created collection: ${collectionName}`);
    } else {
      console.log(`Collection already exists: ${collectionName}`);
    }
  } catch (error: any) {
    // Handle race condition (collection created by another worker)
    if (
      error?.message?.includes("already exists") ||
      error?.status === 409
    ) {
      console.log(`Collection already exists: ${collectionName}`);
      return;
    }

    throw error;
  }
}
