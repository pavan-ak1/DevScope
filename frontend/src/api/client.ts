export const api = {
  async ingestRepo(repoUrl: string, repoName: string) {
    const res = await fetch('/api/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoUrl, repoName })
    });
    if (!res.ok) throw new Error('Failed to start ingestion');
    return res.json();
  },

  async checkJobStatus(jobId: string) {
    const res = await fetch(`/api/status/${jobId}`);
    if (!res.ok) throw new Error('Failed to get status');
    return res.json();
  },

  async askQuestion(repoName: string, question: string) {
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoName, question })
    });
    if (!res.ok) throw new Error('Failed to answer question');
    return res.json();
  }
};
