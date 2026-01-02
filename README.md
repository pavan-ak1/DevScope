# DevScope

**DevScope** is an intelligent RAG (Retrieval-Augmented Generation) backend that allows you to ingest GitHub repositories and ask questions about their codebase using LLMs.

## 🚀 Features

-   **GitHub Ingestion**: Fetches and processes entire repositories using the GitHub Trees API.
-   **Vector Search**: Uses **Qdrant** to store and retrieve relevant code chunks.
-   **Smart Chunking**: Splits code files intelligently based on programming language.
-   **Asynchronous Processing**: Uses **BullMQ** & **Redis** for reliable background ingestion.
-   **Secure Auth**: JWT-based authentication via HTTP-only cookies.
-   **LLM Integration**: Supports **Cerebras** (Llama 3.1) with fallback to **Groq**.

## 🛠️ Tech Stack

-   **Runtime**: Node.js (TypeScript)
-   **Framework**: Express.js
-   **Database**: MongoDB (User data), Qdrant (Vector data), Redis (Queues)
-   **AI/ML**: LangChain, Google Gemini (Embeddings)

## 📦 Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/devscope.git
    cd devscope/backend
    ```

2.  **Install dependencies**
    ```bash
    pnpm install
    ```

3.  **Setup Environment Variables**
    Create a `.env` file in the `backend` root:
    ```env
    PORT=3000
    MONGO_URI=mongodb://localhost:27017/devscope
    REDIS_HOST=localhost
    REDIS_PORT=6379
    QDRANT_URL=http://localhost:6333
    
    # Keys
    GITHUB_TOKEN=your_github_os_token
    GOOGLE_API_KEY=your_gemini_key
    CEREBRAS_API_KEY=your_cerebras_key
    GROQ_API_KEY=your_groq_key
    JWT_SECRET=your_secret_key
    ```

## 🏃‍♂️ Running the Project

You need **Redis** and **Qdrant** running (e.g., via Docker):
```bash
docker run -d -p 6379:6379 redis
docker run -d -p 6333:6333 qdrant/qdrant
```

### Development Mode
Runs the server with hot-reload:
```bash
npm run dev
```

### Worker Process
To process ingestion jobs, you must run the worker in a separate terminal:
```bash
# Development (Source)
npx tsx src/workers/ingestWorker.ts

# Production (Build)
npm run build
node dist/workers/ingestWorker.js
```

## 🔌 API Endpoints

### 1. Ingest Repository
`POST /ingest`
Authenticate and queue a repo for indexing.
```json
{
  "repoUrl": "https://github.com/owner/repo",
  "repoName": "my-repo"
}
```

### 2. Ask Question
`POST /ask`
Chat with the codebase.
```json
{
  "repoName": "my-repo",
  "question": "How is authentication handled?"
}
```

### 3. Check Status
`GET /status/:jobId`
Check the progress of an ingestion job.
