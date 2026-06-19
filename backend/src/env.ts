import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const env = {
  PORT: process.env.PORT || "5000",

  POSTGRES_HOST: process.env.POSTGRES_HOST || "localhost",
  POSTGRES_PORT: process.env.POSTGRES_PORT || "5432",
  POSTGRES_USER: process.env.POSTGRES_USER || "postgres",
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || "postgres",
  POSTGRES_DB: process.env.POSTGRES_DB || "repo_explainer",

  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: process.env.REDIS_PORT || "6379",

  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || "http://localhost:11434",

  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || "",
  CEREBRAS_API_KEY: process.env.CEREBRAS_API_KEY || "",
  GROQ_API_KEY: process.env.GROQ_API_KEY || "",
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || "",
  FRONTEND_URL: process.env.FRONTEND_LINK || "http://localhost:5173"
};