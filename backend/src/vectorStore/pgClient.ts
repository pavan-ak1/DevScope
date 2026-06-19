import pkg from "pg";
import { env } from "../env.js";

const { Pool } = pkg;

export const pgPool = env.DATABASE_URL
  ? new Pool({ connectionString: env.DATABASE_URL })
  : new Pool({
      host: env.POSTGRES_HOST,
      port: Number(env.POSTGRES_PORT),
      user: env.POSTGRES_USER,
      password: env.POSTGRES_PASSWORD,
      database: env.POSTGRES_DB
    });

pgPool.on("connect", () => {
  console.log("Connected to PostgreSQL");
});

pgPool.on("error", (err: Error) => {
  console.error("Postgres error", err);
});