import pkg from "pg";
import { env } from "../env.js";

const { Pool } = pkg;

export const pgPool = new Pool({ connectionString: env.DATABASE_URL })

pgPool.on("connect", () => {
  console.log("Connected to PostgreSQL");
});

pgPool.on("error", (err: Error) => {
  console.error("Postgres error", err);
});