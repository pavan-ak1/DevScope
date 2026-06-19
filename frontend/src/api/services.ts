const API_BASE_URL = 'http://localhost:5000';

export interface IngestRequest {
  repoUrl: string;
  repoName: string;
}

export interface IngestResponse {
  jobId: string;
}

export interface AskRequest {
  repoName: string;
  question: string;
}

export interface AskResponse {
  question: string;
  context: string;
  answer: string;
}

export interface JobStatus {
  status: string;
  progress: number;
  failedReason?: string;
}

export interface Repository {
  name: string;
  ingestedAt: string;
  avgPrecision?: number;
  avgSimilarity?: number;
  totalQueries?: number;
}


export const apiService = {
  async ingestRepository(data: IngestRequest): Promise<IngestResponse> {
    const response = await fetch(`${API_BASE_URL}/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to ingest repository');
    }

    return response.json();
  },

  async askQuestion(data: AskRequest): Promise<AskResponse> {
    const response = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to ask question');
    }

    return response.json();
  },

  async getJobStatus(jobId: string): Promise<JobStatus> {
    const response = await fetch(`${API_BASE_URL}/status/${jobId}`);

    if (!response.ok) {
      throw new Error('Failed to get job status');
    }

    return response.json();
  },

  async getRepositories(): Promise<Repository[]> {
    const response = await fetch(`${API_BASE_URL}/repositories`);

    if (!response.ok) {
      throw new Error('Failed to get repositories');
    }

    return response.json();
  },

  async deleteRepository(repoName: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/repositories/${encodeURIComponent(repoName)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete repository');
    }

    return response.json();
  },

  async getMetrics(repoName: string): Promise<{ avgPrecision: number; avgSimilarity: number; totalQueries: number }> {
    const response = await fetch(`${API_BASE_URL}/metrics/${encodeURIComponent(repoName)}`);

    if (!response.ok) {
      throw new Error('Failed to get repository metrics');
    }

    return response.json();
  },
};

