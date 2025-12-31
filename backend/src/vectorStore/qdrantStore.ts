import { QdrantClient } from "@qdrant/js-client-rest";

export const qdrantClient = new QdrantClient({
    url:"http://localhost:6333",
})

export async function ensureCollection(collectionName:string, vectorSize:number){
    const collections = await qdrantClient.getCollections();
    const exists = collections.collections.some(
        (c)=>c.name === collectionName
    );

    if(!exists){
        await qdrantClient.createCollection(collectionName,{
            vectors:{
                size:vectorSize,
                distance:"Cosine",
            },
        });

        console.log(`Created collection: ${collectionName}`);
    }
    else{
         console.log(`Collection already exists: ${collectionName}`);
    }
}