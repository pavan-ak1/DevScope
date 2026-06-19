import React, { useState } from 'react';
import { Database } from 'lucide-react';

interface IngestFormProps {
  onSubmit: (repoUrl: string, repoName: string) => void;
  isLoading: boolean;
}

export const IngestForm: React.FC<IngestFormProps> = ({ onSubmit, isLoading }) => {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url && name) {
      onSubmit(url, name);
    }
  };

  return (
    <div className="glass-card">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <Database size={48} color="var(--accent-color)" style={{ marginBottom: '1rem' }} />
        <h2>Connect Repository</h2>
        <p className="subtitle" style={{ marginBottom: 0 }}>Enter GitHub details to ingest and analyze.</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="repoUrl">GitHub Repository URL</label>
          <input
            id="repoUrl"
            type="url"
            placeholder="https://github.com/owner/repo"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="repoName">Short Name</label>
          <input
            id="repoName"
            type="text"
            placeholder="e.g. devscope-core"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <button type="submit" className="primary-btn" disabled={isLoading || !url || !name}>
          {isLoading ? 'Connecting...' : 'Begin Ingestion'}
        </button>
      </form>
    </div>
  );
};
