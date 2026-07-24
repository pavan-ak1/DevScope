import React, { useState } from 'react';
import { Database, GitFork, Link2, AlertCircle } from 'lucide-react';

interface IngestFormProps {
  onSubmit: (repoUrl: string, repoName: string) => void;
  isLoading: boolean;
}

export const IngestForm: React.FC<IngestFormProps> = ({ onSubmit, isLoading }) => {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [touchedName, setTouchedName] = useState(false);

  const handleUrlChange = (value: string) => {
    setUrl(value);
    
    // Automatically suggest short name if user hasn't typed a custom one yet
    if (!touchedName) {
      try {
        const trimmed = value.trim();
        // Remove trailing slashes and .git extension
        const cleanUrl = trimmed.replace(/\.git$/, '').replace(/\/$/, '');
        const parts = cleanUrl.split('/');
        
        // E.g. https://github.com/owner/repo
        if (parts.length >= 2) {
          const repoName = parts[parts.length - 1];
          const repoOwner = parts[parts.length - 2];
          
          if (repoName && repoOwner && !repoName.includes('github.com')) {
            setName(repoName.toLowerCase());
          }
        }
      } catch (err) {
        // Fall back gracefully
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url && name) {
      onSubmit(url.trim(), name.trim());
    }
  };

  const isUrlValid = (inputUrl: string) => {
    if (!inputUrl) return true;
    try {
      const parsed = new URL(inputUrl);
      return parsed.hostname === 'github.com' || parsed.hostname.endsWith('github.com');
    } catch {
      return false;
    }
  };

  const urlError = url && !isUrlValid(url);

  return (
    <div className="glass-card" style={{ maxWidth: '480px', width: '100%', margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Database size={18} color="var(--primary)" />
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Ingestion Pipeline
          </span>
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Connect New Codebase
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
          Index your GitHub repository to generate semantic vector embeddings and enable intelligent Q&A code search.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="form-group">
          <label htmlFor="repoUrl" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Link2 size={13} color="var(--primary)" />
            GitHub Repository URL
          </label>
          <input
            id="repoUrl"
            type="url"
            placeholder="https://github.com/facebook/react"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            required
            disabled={isLoading}
            style={{ 
              width: '100%',
              borderColor: urlError ? 'var(--error)' : undefined
            }}
          />
          {urlError && (
            <span style={{ fontSize: '0.75rem', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
              <AlertCircle size={12} /> Please enter a valid GitHub URL (e.g. github.com/owner/repo)
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="repoName" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <GitFork size={13} color="var(--accent)" />
              Workspace Identifier
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Short URL-friendly label
            </span>
          </label>
          <input
            id="repoName"
            type="text"
            placeholder="e.g. react-core"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setTouchedName(true);
            }}
            required
            disabled={isLoading}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ 
          fontSize: '0.78rem', 
          color: 'var(--text-secondary)', 
          background: 'rgba(255, 255, 255, 0.01)', 
          border: '1px solid var(--border-color)', 
          borderRadius: 'var(--radius-sm)', 
          padding: '0.75rem 0.9rem',
          lineHeight: 1.45,
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'flex-start'
        }}>
          <span style={{ flexShrink: 0 }}>💡</span>
          <span>
            DevScope fetches public codebase structures dynamically. Make sure the target repository is public and contains code.
          </span>
        </div>

        <button 
          type="submit" 
          className="primary-btn" 
          style={{ width: '100%', marginTop: '0.25rem', height: '40px' }} 
          disabled={isLoading || !url || !name || !!urlError}
        >
          {isLoading ? (
            <>
              <span className="icon-spin">⏳</span> Enqueueing codebase...
            </>
          ) : (
            <>
              <Database size={14} /> Begin Code Ingestion
            </>
          )}
        </button>
      </form>
    </div>
  );
};
