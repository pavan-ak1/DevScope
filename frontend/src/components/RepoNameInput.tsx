import { useState } from 'react';
import { MessageCircle, Database } from 'lucide-react';

interface RepoNameInputProps {
  onStartChat: (repoName: string) => void;
  onShowIngestForm: () => void;
}

export default function RepoNameInput({ onStartChat, onShowIngestForm }: RepoNameInputProps) {
  const [repoName, setRepoName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoName.trim()) {
      onStartChat(repoName.trim());
    }
  };

  return (
    <div className="glass-card">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <MessageCircle size={48} color="var(--primary-color)" style={{ marginBottom: '1rem' }} />
        <h2>Start Chatting</h2>
        <p className="subtitle">Enter repository name to start asking questions</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="repoName">Repository Name</label>
          <input
            id="repoName"
            type="text"
            placeholder="e.g. my-repo"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="primary-btn" disabled={!repoName.trim()}>
          <MessageCircle size={20} style={{ marginRight: '0.5rem' }} />
          Start Chat
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <p className="subtitle" style={{ marginBottom: '1rem' }}>
          Don't have a repository yet?
        </p>
        <button onClick={onShowIngestForm} className="secondary-btn">
          <Database size={20} style={{ marginRight: '0.5rem' }} />
          Add New Repository
        </button>
      </div>
    </div>
  );
}
