import { Redis } from "ioredis";
import { env } from "../env.js";

export const redis = env.REDIS_URL
  ? new Redis(env.REDIS_URL, { maxRetriesPerRequest: null })
  : new Redis({
      host: env.REDIS_HOST,
      port: Number(env.REDIS_PORT),
      maxRetriesPerRequest: null
    });