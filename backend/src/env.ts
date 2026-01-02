import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolves to backend/.env assuming this file is in backend/src/env.ts
const envPath = path.resolve(__dirname, "../.env");

dotenv.config({ path: envPath });

console.log(`[env] Loaded configuration from ${envPath}`);
