import { Queue } from "bullmq";
import { redis } from "./redis.js";

export const ingestQueue = new Queue("repo-ingestion",{
    connection:redis,
})