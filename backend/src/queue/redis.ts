import { Redis } from "ioredis";

export const redis = new Redis({
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest: null,

  // optional but recommended
  enableReadyCheck: false,
});
